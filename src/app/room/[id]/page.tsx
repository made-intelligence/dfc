"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff, FileText, Activity, Clock, Loader2, User, Signal, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

// Web Speech API types
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export default function ConsultationRoom() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { addToast } = useToast();
  
  // Data State
  const [loading, setLoading] = useState(true);
  const [meetingData, setMeetingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Media State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // AI Scribe State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [showScribePanel, setShowScribePanel] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const recognitionRef = useRef<any>(null);
  
  // New Features State
  const [signalStrength, setSignalStrength] = useState<number>(4); // 0-4
  const [myLocation, setMyLocation] = useState<string | null>(null);

  // 1. Fetch Meeting Details & Sync Timer
  useEffect(() => {
    const fetchMeetingDetails = async () => {
      try {
        // Fetch location first (if possible) to send with the request
        let locationParam = "";
        try {
            if ("geolocation" in navigator) {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                 // Simple reverse geocode shim (or just coords)
                 // For now, sending coords as string: "Lat: x, Long: y"
                 // Ideally use a service like Nominatim or Google Maps API
                 locationParam = `Lat: ${position.coords.latitude.toFixed(4)}, Long: ${position.coords.longitude.toFixed(4)}`;
                 setMyLocation(locationParam);
            }
        } catch (e) {
            console.warn("Location access denied or unavailable");
        }

        const response = await fetch(`/api/room/${id}${locationParam ? `?location=${encodeURIComponent(locationParam)}` : ''}`);
        const data = await response.json();

        if (response.ok && data.success) {
            setMeetingData(data.appointment);
            
            // Sync Timer logic
            // Assuming startTime is "HH:MM" and appointmentDate is ISO string
            const apptDate = new Date(data.appointment.appointmentDate);
            const [hours, mins] = data.appointment.startTime.split(':').map(Number);
            apptDate.setHours(hours, mins, 0, 0);
            
            const now = new Date();
            const diffSeconds = Math.floor((now.getTime() - apptDate.getTime()) / 1000);
            
            // If the appointment started in the past, show the duration from start time
            // If it's in the future, it will show 0 until start time
            setCallDuration(diffSeconds > 0 ? diffSeconds : 0);

            // Auto-"Connect" Logic (Mock)
            // If we successfully fetched data, simulate connection after delay
            setTimeout(() => {
                setIsConnected(true);
                addToast({
                    title: "Connected",
                    description: "Secure connection established.",
                    type: "success"
                });
            }, 2000);

        } else {
            setError(data.error || "Failed to join meeting");
            addToast({ title: "Error", description: data.error, type: "error" });
        }
      } catch (err) {
        setError("Connection failed");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
        fetchMeetingDetails();
    }
  }, [id, addToast]);


  // 2. Initialize Camera
  // Use a ref to track the stream for cleanup to avoid closure staleness
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({ 
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user"
            }, 
            audio: true 
        });

        if (!mounted) {
            // Component unmounted during the async call, stop tracks immediately
            userStream.getTracks().forEach(track => track.stop());
            return;
        }

        streamRef.current = userStream;
        setStream(userStream);
        
      } catch (err) {
        console.error("Error accessing media devices:", err);
        if (mounted) {
            addToast({ title: "Camera Error", description: "Could not access camera/microphone. Please check permissions.", type: "error" });
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [addToast]);

  // Sync Stream to Video Element
  useEffect(() => {
      const videoEl = videoRef.current;
      if (videoEl && stream) {
           videoEl.srcObject = stream;
           // Attempt to play only if paused or not playing to satisfy autoplay policies
           if (videoEl.paused) {
                videoEl.play().catch(e => console.warn("Video play error:", e));
           }
      }
  }, [stream]);

  // 3. Timer Interval
  useEffect(() => {
    const timer = setInterval(() => {
        // Increment call duration every second
        // For better precision, we should re-calculate from startTime, 
        // but simple increment is enough for this context as we synced initial value
        setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 4. Overlap Warning & Auto-End Logic
  useEffect(() => {
    if (!meetingData || !meetingData.endTime) return;

    const checkTime = () => {
        const now = new Date();
        const apptDate = new Date(meetingData.appointmentDate); // Base date
        
        // Parse End Time
        const [endHours, endMins] = meetingData.endTime.split(':').map(Number);
        const endTimeDate = new Date(apptDate);
        endTimeDate.setHours(endHours, endMins, 0, 0);

        const diffSeconds = (endTimeDate.getTime() - now.getTime()) / 1000;

        // Auto-End if time passed AND next appointment exists (strict punctuality)
        if (diffSeconds <= 0 && meetingData.nextAppointmentStartTime) {
             addToast({
                title: "Session Ended",
                description: "The session has ended to accommodate the next appointment.",
                type: "error",
                duration: 5000
             });
             setTimeout(() => endCall(), 1000); 
             return;
        }

        // Warning 5 minutes before end if next appointment exists
        if (meetingData.nextAppointmentStartTime && diffSeconds <= 300 && diffSeconds > 298) {
             addToast({
                title: "Upcoming Appointment",
                description: "You have another appointment starting in 5 minutes. Please wrap up soon.",
                type: "warning", 
                duration: 10000
             });
        }
    };

    const timer = setInterval(checkTime, 1000);
    return () => clearInterval(timer);
  }, [meetingData, addToast]);

  // 4. Initialize Speech Recognition (AI Scribe) - DOCTOR ONLY
  useEffect(() => {
    if (meetingData?.currentUser?.role !== 'DFC_MEMBER') return;

    if (typeof window !== "undefined") {
      const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
      const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

      if (SpeechRecognitionConstructor) {
        const recognition = new SpeechRecognitionConstructor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
              setTranscript(prev => prev + finalTranscript);
              
              // Analyze final transcript for notes
              if (finalTranscript.toLowerCase().includes("headache")) {
                 setNotes(prev => prev + "- Patient reports headache\n");
              }
              if (finalTranscript.toLowerCase().includes("fever")) {
                 setNotes(prev => prev + "- Patient reports fever\n");
              }
               if (finalTranscript.toLowerCase().includes("pain")) {
                 setNotes(prev => prev + "- Patient reports pain\n");
              }
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [meetingData]);

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.enabled = !videoEnabled);
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !audioEnabled);
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleScribe = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const endCall = async () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const isDoctor = meetingData?.currentUser?.role === 'DFC_MEMBER';

      // If doctor and there's a transcript, save it as a draft clinical encounter
      if (isDoctor && meetingData?.id && transcript.trim()) {
        try {
          // Find the patient's profile ID
          const patientProfileRes = await fetch(`/api/emr/patients?appointmentId=${meetingData.id}`, {
            credentials: 'include',
          });
          const patientData = await patientProfileRes.json();
          const patientProfileId = patientData?.patientProfileId;

          if (patientProfileId) {
            await fetch('/api/emr/encounters', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                appointmentId: meetingData.id,
                patientId: patientProfileId,
                encounterType: 'CONSULTATION',
                encounterDate: new Date().toISOString(),
                chiefComplaint: meetingData.reason || 'Telemedicine consultation',
                rawTranscript: transcript,
                scribeNotes: notes,
                status: 'DRAFT',
              }),
            });

            addToast({ type: 'success', title: 'Saved', description: 'Consultation note saved as draft.' });
            router.push(`/doctor/emr/${patientProfileId}?openEncounter=true`);
            return;
          }
        } catch {
          // Fall through to default redirect
        }
      }

      const redirectUrl = isDoctor ? '/doctor/appointments' : '/appointments';
      router.push(redirectUrl);
  };
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white"><div className="text-center"><h2 className="text-xl font-bold mb-2">Error</h2><p>{error}</p><Button className="mt-4" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button></div></div>;

  const isDoctor = meetingData?.currentUser?.role === 'DFC_MEMBER';
  // If current user is doctor, show patient name. If patient, show doctor name.
  const otherPartyName = isDoctor ? meetingData?.patient?.name : meetingData?.doctor?.name;
  const otherPartyRole = isDoctor ? "Patient" : meetingData?.doctor?.doctorProfile?.specialty?.name || "Doctor";

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-2">
            <Activity className="text-blue-400" />
            <span className="font-semibold text-lg hidden md:block">DFC Virtual Care</span>
            <span className="font-semibold text-lg md:hidden">DFC</span>
        </div>
        <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-2 font-mono">
            <Clock className="w-4 h-4" />
            {Math.floor(callDuration / 60).toString().padStart(2, '0')}:{(callDuration % 60).toString().padStart(2, '0')}
        </div>
        
        {/* Signal Strength & Location Indicator */}
        <div className="flex items-center gap-4 ml-4">
             {isConnected && (
                 <>
                    <div className="flex items-center gap-1 text-green-400" title="Signal Strength: Excellent">
                        <Signal className="w-5 h-5" />
                        <span className="text-xs hidden md:inline">Excellent</span>
                    </div>
                 </>
             )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Video Area (Left) */}
        <div className="flex-1 relative bg-black flex items-center justify-center p-2 md:p-4">
            
            {/* Remote Video (Placeholder / Connected State) */}
            <div className="w-full h-full bg-gray-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                {!isConnected ? (
                   <div className="text-center animate-pulse">
                        <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                        <span className="text-gray-400 text-lg">Connecting to secure room...</span>
                   </div>
                ) : (
                   <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
                        {/* Avatar / Initials when no real video */}
                        <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-6">
                            <span className="text-4xl font-bold text-gray-400">{otherPartyName?.charAt(0)}</span>
                        </div>
                        <h3 className="text-2xl font-semibold mb-2">{otherPartyName}</h3>
                        <p className="text-blue-400">{otherPartyRole}</p>
                        <p className="text-green-500 text-sm mt-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Connected (Encrypted)
                        </p>
                        
                        {/* Remote Location Badge */}
                        {(isDoctor ? meetingData?.patientLocation : meetingData?.doctorLocation) && (
                            <div className="mt-4 flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full text-xs text-blue-200">
                                <MapPin className="w-3 h-3" />
                                <span>Joining from: {isDoctor ? meetingData.patientLocation : meetingData.doctorLocation}</span>
                            </div>
                        )}
                   </div>
                )}
                
                {/* Overlay Info */}
                 {isConnected && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 md:p-6 pb-20 md:pb-6 pointer-events-none">
                        <h3 className="text-lg md:text-xl font-semibold text-white">{otherPartyName}</h3>
                        <p className="text-sm md:text-base text-gray-300">{otherPartyRole}</p>
                    </div>
                 )}
            </div>

            {/* Local Video (PIP) */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 w-24 h-20 md:w-48 md:h-36 bg-gray-900 rounded-xl border-2 border-gray-700 shadow-2xl overflow-hidden z-20">
                 <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className={`w-full h-full object-cover ${!videoEnabled ? 'hidden' : ''}`} 
                 />
                 {!videoEnabled && (
                     <div className="w-full h-full flex items-center justify-center bg-gray-800">
                         <div className="flex flex-col items-center">
                            <User className="w-8 h-8 text-gray-500 mb-1" />
                            <span className="text-xs text-gray-500">Video Off</span>
                         </div>
                     </div>
                 )}
            </div>

            {/* Controls */}
             <div className="absolute top-4 md:bottom-8 md:top-auto left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 bg-gray-800/90 backdrop-blur p-2 md:p-4 rounded-full shadow-xl z-30">
                 <Button 
                    variant={audioEnabled ? "secondary" : "destructive"}
                    size="icon" 
                    className="rounded-full w-10 h-10 md:w-12 md:h-12 border border-gray-600" 
                    onClick={toggleAudio}
                >
                    {audioEnabled ? <Mic className="w-4 h-4 md:w-6 md:h-6" /> : <MicOff className="w-4 h-4 md:w-6 md:h-6" />}
                 </Button>
                 <Button 
                    variant={videoEnabled ? "secondary" : "destructive"}
                    size="icon" 
                    className="rounded-full w-10 h-10 md:w-12 md:h-12 border border-gray-600" 
                    onClick={toggleVideo}
                >
                    {videoEnabled ? <Video className="w-4 h-4 md:w-6 md:h-6" /> : <VideoOff className="w-4 h-4 md:w-6 md:h-6" />}
                 </Button>
                  <Button 
                    variant={isDoctor ? 'destructive' : 'secondary'} 
                    size="icon"
                    className={`rounded-full w-12 h-12 md:w-16 md:h-16 ${isDoctor ? 'shadow-red-900/20' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={endCall}
                    title={isDoctor ? "End Call" : "Leave Call"}
                >
                    <PhoneOff className="w-5 h-5 md:w-8 md:h-8" />
                 </Button>
            </div>

            {/* AI Scribe Toggle Button (Mobile Only) - DOCTOR ONLY */}
            {isDoctor && (
                <Button
                className="md:hidden absolute bottom-24 right-4 rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-xl z-20"
                size="icon"
                onClick={() => setShowScribePanel(!showScribePanel)}
                >
                <FileText className="w-5 h-5" />
                </Button>
            )}
        </div>

        {/* AI Scribe Panel (Right) - Desktop & Mobile Overlay - DOCTOR ONLY */}
        {isDoctor && (
            <div className={`${showScribePanel ? 'fixed inset-0 z-40 md:relative' : 'hidden'} md:flex w-full md:w-96 bg-gray-800 md:border-l border-gray-700 flex-col transition-all duration-300`}>
                <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                    <div className="flex items-center justify-between mb-4">
                        <Button
                        className="md:hidden"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowScribePanel(false)}
                        >
                        <span className="text-2xl">&times;</span>
                        </Button>
                        <h2 className="font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            AI Medical Scribe
                        </h2>
                        <Button 
                            size="sm" 
                            variant={isListening ? "default" : "outline"}
                            className={isListening ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 border-gray-600 hover:bg-gray-700"}
                            onClick={toggleScribe}
                        >
                            {isListening ? "Active" : "Start Scribe"}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Live Transcript</label>
                        <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300 min-h-[150px] whitespace-pre-wrap font-mono border border-gray-700">
                            {transcript || <span className="text-gray-600 italic">Listening for speech...</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Smart Notes (Auto-Generated)</label>
                        <textarea 
                            className="w-full bg-gray-900 rounded-lg p-3 text-sm text-white min-h-[200px] border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                            value={notes}
                            readOnly
                            placeholder="AI will extract key symptoms and medical terms here..."
                        />
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}

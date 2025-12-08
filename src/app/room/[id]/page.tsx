"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff, FileText, Activity, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Topbar from "@/components/layout/Topbar";

// Web Speech API types
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export default function ConsultationRoom() {
  const { id } = useParams();
  const router = useRouter();
  
  // Media State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // AI Scribe State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [showScribePanel, setShowScribePanel] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const recognitionRef = useRef<any>(null);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        setStream(userStream);
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Timer for call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize Speech Recognition (AI Scribe)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
      const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

      if (SpeechRecognitionConstructor) {
        const recognition = new SpeechRecognitionConstructor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(prev => prev + " " + currentTranscript);
          
          // Simple "AI" processing: Extract symptoms
          // In a real app, send chunks to an LLM API
          if (currentTranscript.toLowerCase().includes("headache")) {
             setNotes(prev => prev + "- Patient reports headache\n");
          }
          if (currentTranscript.toLowerCase().includes("fever")) {
             setNotes(prev => prev + "- Patient reports fever\n");
          }
           if (currentTranscript.toLowerCase().includes("pain")) {
             setNotes(prev => prev + "- Patient reports pain\n");
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

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

  const endCall = () => {
      // Logic to save notes can go here
      window.close();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-2">
            <Activity className="text-blue-400" />
            <span className="font-semibold text-lg">DFC Virtual Care</span>
        </div>
        <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {Math.floor(callDuration / 60).toString().padStart(2, '0')}:{(callDuration % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Video Area (Left) */}
        <div className="flex-1 relative bg-black flex items-center justify-center p-2 md:p-4">
            
            {/* Remote Video (Placeholder) */}
            <div className="w-full h-full bg-gray-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <span className="text-gray-500 text-xl font-light">Doctor is connecting...</span>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 md:p-6 pb-20 md:pb-6">
                    <h3 className="text-lg md:text-xl font-semibold">Dr. Sarah Johnson</h3>
                    <p className="text-sm md:text-base text-gray-300">Cardiologist</p>
                </div>
            </div>

            {/* Local Video (PIP) */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 w-24 h-20 md:w-48 md:h-36 bg-gray-900 rounded-xl border-2 border-gray-700 shadow-2xl overflow-hidden">
                 <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className={`w-full h-full object-cover ${!videoEnabled ? 'hidden' : ''}`} 
                 />
                 {!videoEnabled && (
                     <div className="w-full h-full flex items-center justify-center">
                         <VideoOff className="text-gray-500" />
                     </div>
                 )}
            </div>

            {/* Controls */}
             <div className="absolute top-4 md:bottom-8 md:top-auto left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 bg-gray-800/90 backdrop-blur p-2 md:p-4 rounded-full shadow-xl z-20">
                 <Button 
                    variant={audioEnabled ? "secondary" : "destructive"}
                    size="icon" 
                    className="rounded-full w-10 h-10 md:w-12 md:h-12" 
                    onClick={toggleAudio}
                >
                    {audioEnabled ? <Mic className="w-4 h-4 md:w-6 md:h-6" /> : <MicOff className="w-4 h-4 md:w-6 md:h-6" />}
                 </Button>
                 <Button 
                    variant={videoEnabled ? "secondary" : "destructive"}
                    size="icon" 
                    className="rounded-full w-10 h-10 md:w-12 md:h-12" 
                    onClick={toggleVideo}
                >
                    {videoEnabled ? <Video className="w-4 h-4 md:w-6 md:h-6" /> : <VideoOff className="w-4 h-4 md:w-6 md:h-6" />}
                 </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    className="rounded-full w-12 h-12 md:w-16 md:h-16"
                    onClick={endCall}
                >
                    <PhoneOff className="w-5 h-5 md:w-8 md:h-8" />
                 </Button>
            </div>

            {/* AI Scribe Toggle Button (Mobile Only) */}
            <Button
              className="md:hidden absolute bottom-4 right-4 rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-xl z-20"
              size="icon"
              onClick={() => setShowScribePanel(!showScribePanel)}
            >
              <FileText className="w-5 h-5" />
            </Button>
        </div>

        {/* AI Scribe Panel (Right) - Desktop & Mobile Overlay */}
        <div className={`${showScribePanel ? 'fixed inset-0 z-30 md:relative' : 'hidden'} md:flex w-full md:w-96 bg-gray-800 md:border-l border-gray-700 flex-col`}>
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
                    <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300 min-h-[150px] whitespace-pre-wrap font-mono">
                        {transcript || "Listening for speech..."}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Smart Notes (Auto-Generated)</label>
                    <textarea 
                        className="w-full bg-gray-900 rounded-lg p-3 text-sm text-white min-h-[200px] border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        value={notes}
                        readOnly
                        placeholder="AI will extract key symptoms and medical terms here..."
                    />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

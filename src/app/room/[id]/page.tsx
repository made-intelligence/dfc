"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "@/lib/navigation";
import Daily, {
  type DailyCall,
  type DailyParticipant,
  type DailyEventObjectNetworkQualityEvent,
} from "@daily-co/daily-js";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  FileText,
  Activity,
  Clock,
  Loader2,
  User,
  Signal,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardUrl } from "@/lib/dashboard-url";
import { formatInstantWat, formatWatRange } from "@/lib/wat";

// Web Speech API types
interface IWindow extends Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webkitSpeechRecognition: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SpeechRecognition: any;
}

interface MeetingData {
  id: string;
  startTime: string;
  endTime: string;
  startsAt: string;
  endsAt: string;
  appointmentDate: string;
  reason: string | null;
  doctor: { id: string; name: string; doctorProfile?: { specialty?: { name: string } | null } | null };
  patient: { id: string; name: string };
  patientLocation: string | null;
  doctorLocation: string | null;
  nextAppointmentStartTime: string | null;
  currentUser: { id: string; role: "DFC_MEMBER" | "PATIENT"; name: string };
}

type NetworkState = "good" | "warning" | "bad" | "unknown";

const NETWORK_LABEL: Record<NetworkState, { text: string; className: string }> = {
  good: { text: "Good connection", className: "text-green-400" },
  warning: { text: "Weak connection", className: "text-amber-400" },
  bad: { text: "Poor connection", className: "text-red-400" },
  unknown: { text: "Checking connection", className: "text-gray-400" },
};

/** Attach a single track to a media element, only when it actually changes. */
function useTrack(ref: React.RefObject<HTMLMediaElement | null>, track: MediaStreamTrack | undefined) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const current = el.srcObject as MediaStream | null;
    if (!track) {
      el.srcObject = null;
      return;
    }
    if (current?.getTracks()[0]?.id === track.id) return;
    el.srcObject = new MediaStream([track]);
    el.play().catch(() => {
      /* autoplay can be refused until the user interacts; the controls are a click away */
    });
  }, [ref, track]);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0D1F3C] px-4 text-white">
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = sec.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function ConsultationRoom() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { addToast } = useToast();

  // Meeting data
  const [loading, setLoading] = useState(true);
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [call, setCall] = useState<{ url: string; token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tooEarlyUntil, setTooEarlyUntil] = useState<string | null>(null);
  const [consentPatientId, setConsentPatientId] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Call state
  const callRef = useRef<DailyCall | null>(null);
  const [joinState, setJoinState] = useState<"idle" | "joining" | "joined" | "left" | "error">("idle");
  const [localParticipant, setLocalParticipant] = useState<DailyParticipant | null>(null);
  const [remoteParticipant, setRemoteParticipant] = useState<DailyParticipant | null>(null);
  const [networkState, setNetworkState] = useState<NetworkState>("unknown");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // AI Scribe state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [showScribePanel, setShowScribePanel] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Clock
  const [now, setNow] = useState(() => Date.now());
  const endingRef = useRef(false);

  // 1. Fetch meeting details and the call credentials
  useEffect(() => {
    let cancelled = false;

    const fetchMeetingDetails = async () => {
      setLoading(true);
      setError(null);
      setTooEarlyUntil(null);
      setConsentPatientId(null);
      try {
        let locationParam = "";
        try {
          if ("geolocation" in navigator) {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            locationParam = `Lat: ${position.coords.latitude.toFixed(4)}, Long: ${position.coords.longitude.toFixed(4)}`;
          }
        } catch {
          // Location is optional
        }

        const response = await fetch(
          `/api/room/${id}${locationParam ? `?location=${encodeURIComponent(locationParam)}` : ""}`
        );
        const data = await response.json();
        if (cancelled) return;

        if (response.ok && data.success) {
          setMeetingData(data.appointment);
          if (data.call) {
            setCall(data.call);
          } else {
            setError(data.callError || "The video call is unavailable right now.");
          }
        } else if (data.code === "CONSENT_REQUIRED") {
          setConsentPatientId(data.patientProfileId);
        } else if (data.code === "TOO_EARLY") {
          setTooEarlyUntil(data.startsAt);
        } else {
          setError(data.error || "Failed to join the consultation");
        }
      } catch {
        if (!cancelled) setError("Connection failed. Please check your internet and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (id) fetchMeetingDetails();
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  // Waiting for the room to open: retry automatically when it does.
  useEffect(() => {
    if (!tooEarlyUntil) return;
    const opensAt = new Date(tooEarlyUntil).getTime() - 10 * 60_000;
    const wait = Math.max(5_000, opensAt - Date.now() + 2_000);
    const timer = setTimeout(() => setReloadKey((k) => k + 1), Math.min(wait, 2_147_000_000));
    return () => clearTimeout(timer);
  }, [tooEarlyUntil]);

  // 2. Join the Daily call
  const refreshParticipants = useCallback(() => {
    const co = callRef.current;
    if (!co) return;
    const all = co.participants();
    setLocalParticipant(all.local ?? null);
    const remote = Object.values(all).find((p) => !p.local) ?? null;
    setRemoteParticipant(remote);
  }, []);

  useEffect(() => {
    if (!call) return;

    let disposed = false;
    let co: DailyCall | null = null;

    const onNetwork = (ev?: DailyEventObjectNetworkQualityEvent) => {
      if (ev?.networkState) setNetworkState(ev.networkState);
    };
    const onParticipantJoined = (ev?: { participant: DailyParticipant }) => {
      refreshParticipants();
      if (ev && !ev.participant.local) {
        addToast({ type: "success", title: `${ev.participant.user_name || "The other participant"} joined` });
      }
    };
    const onParticipantLeft = (ev?: { participant: DailyParticipant }) => {
      refreshParticipants();
      if (ev && !endingRef.current) {
        addToast({ type: "info", title: `${ev.participant.user_name || "The other participant"} left the call` });
      }
    };
    const onError = (ev?: { errorMsg?: string }) => {
      setJoinState("error");
      setError(ev?.errorMsg || "The video call was disconnected.");
    };
    const onCameraError = () => {
      addToast({
        type: "error",
        title: "Camera or microphone unavailable",
        description: "Allow access in your browser settings, then refresh the page.",
      });
    };

    const start = async () => {
      // Daily allows one call object per page. React runs effects twice in
      // development, so finish tearing down any previous one first.
      const previous = Daily.getCallInstance();
      if (previous) await previous.destroy().catch(() => {});
      if (disposed) return;

      co = Daily.createCallObject({ subscribeToTracksAutomatically: true });
      callRef.current = co;
      co.on("joined-meeting", refreshParticipants)
        .on("participant-joined", onParticipantJoined)
        .on("participant-updated", refreshParticipants)
        .on("participant-left", onParticipantLeft)
        .on("track-started", refreshParticipants)
        .on("track-stopped", refreshParticipants)
        .on("network-quality-change", onNetwork)
        .on("camera-error", onCameraError)
        .on("error", onError);

      setJoinState("joining");
      try {
        await co.join({ url: call.url, token: call.token });
        if (disposed) return;
        setJoinState("joined");
        refreshParticipants();
      } catch (err) {
        if (disposed) return;
        setJoinState("error");
        setError(err instanceof Error ? err.message : "Could not join the video call.");
      }
    };
    start();

    return () => {
      disposed = true;
      const instance = co;
      callRef.current = null;
      if (!instance) return;
      instance
        .off("joined-meeting", refreshParticipants)
        .off("participant-joined", onParticipantJoined)
        .off("participant-updated", refreshParticipants)
        .off("participant-left", onParticipantLeft)
        .off("track-started", refreshParticipants)
        .off("track-stopped", refreshParticipants)
        .off("network-quality-change", onNetwork)
        .off("camera-error", onCameraError)
        .off("error", onError);
      instance.destroy().catch(() => {});
    };
  }, [call, refreshParticipants, addToast]);

  // Media tracks to elements
  const localVideoTrack =
    localParticipant?.tracks.video.state === "playable" ? localParticipant.tracks.video.persistentTrack : undefined;
  const remoteVideoTrack =
    remoteParticipant?.tracks.video.state === "playable" ? remoteParticipant.tracks.video.persistentTrack : undefined;
  const remoteAudioTrack =
    remoteParticipant?.tracks.audio.state === "playable" ? remoteParticipant.tracks.audio.persistentTrack : undefined;
  useTrack(localVideoRef, localVideoTrack);
  useTrack(remoteVideoRef, remoteVideoTrack);
  useTrack(remoteAudioRef, remoteAudioTrack);

  // 3. Clock
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 4. Speech recognition (AI scribe), doctor only
  useEffect(() => {
    if (meetingData?.currentUser?.role !== "DFC_MEMBER") return;
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + " ";
      }
      if (!finalTranscript) return;
      setTranscript((prev) => prev + finalTranscript);
      const lower = finalTranscript.toLowerCase();
      if (lower.includes("headache")) setNotes((prev) => prev + "- Patient reports headache\n");
      if (lower.includes("fever")) setNotes((prev) => prev + "- Patient reports fever\n");
      if (lower.includes("pain")) setNotes((prev) => prev + "- Patient reports pain\n");
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        /* not started */
      }
    };
  }, [meetingData]);

  const isDoctor = meetingData?.currentUser?.role === "DFC_MEMBER";

  const endCall = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;

    try {
      recognitionRef.current?.stop();
    } catch {
      /* not started */
    }
    try {
      await callRef.current?.leave();
    } catch {
      /* already left */
    }
    setJoinState("left");

    if (isDoctor && meetingData?.id) {
      // Record the consultation as held. The API only accepts this when both
      // the doctor and the patient actually joined, so a no-show stays open.
      fetch("/api/doctor/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: meetingData.id, status: "COMPLETED" }),
      }).catch(() => {});

      // Save the transcript as a draft encounter for the doctor to finish.
      if (transcript.trim()) {
        try {
          const patientProfileRes = await fetch(`/api/emr/patients?appointmentId=${meetingData.id}`, {
            credentials: "include",
          });
          const patientData = await patientProfileRes.json();
          const patientProfileId = patientData?.patientProfileId;

          if (patientProfileId) {
            await fetch("/api/emr/encounters", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                appointmentId: meetingData.id,
                patientId: patientProfileId,
                encounterType: "CONSULTATION",
                encounterDate: new Date().toISOString(),
                chiefComplaint: meetingData.reason || "Telemedicine consultation",
                rawTranscript: transcript,
                scribeNotes: notes,
                status: "DRAFT",
              }),
            });

            addToast({ type: "success", title: "Saved", description: "Consultation note saved as draft." });
            router.push(`/doctor/emr/${patientProfileId}?openEncounter=true`);
            return;
          }
        } catch {
          // Fall through to the default redirect
        }
      }
    }

    router.push(isDoctor ? "/doctor/appointments" : "/appointments");
  }, [isDoctor, meetingData, transcript, notes, router, addToast]);

  // 5. Overrun warning, and auto-end when the next patient is due
  const endsAtMs = meetingData ? new Date(meetingData.endsAt).getTime() : null;
  const secondsLeft = endsAtMs ? Math.floor((endsAtMs - now) / 1000) : null;
  const warnedRef = useRef(false);
  useEffect(() => {
    if (secondsLeft === null || !meetingData?.nextAppointmentStartTime) return;
    if (secondsLeft <= 300 && secondsLeft > 0 && !warnedRef.current) {
      warnedRef.current = true;
      addToast({
        title: "Upcoming Appointment",
        description: "You have another appointment starting in 5 minutes. Please wrap up soon.",
        type: "warning",
        duration: 10000,
      });
    }
    if (secondsLeft <= 0 && !endingRef.current) {
      addToast({
        title: "Session Ended",
        description: "The session has ended to make way for the next appointment.",
        type: "error",
        duration: 5000,
      });
      endCall();
    }
  }, [secondsLeft, meetingData, addToast, endCall]);

  const toggleVideo = () => {
    const next = !videoEnabled;
    callRef.current?.setLocalVideo(next);
    setVideoEnabled(next);
  };

  const toggleAudio = () => {
    const next = !audioEnabled;
    callRef.current?.setLocalAudio(next);
    setAudioEnabled(next);
  };

  const toggleScribe = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
    setIsListening(!isListening);
  };

  const giveConsent = async () => {
    if (!consentPatientId || !consentChecked) return;
    setConsentSaving(true);
    try {
      const res = await fetch("/api/emr/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ patientId: consentPatientId, type: "TELEMEDICINE", given: true }),
      });
      if (!res.ok) throw new Error();
      setReloadKey((k) => k + 1);
    } catch {
      addToast({ type: "error", title: "Could not save your consent", description: "Please try again." });
    } finally {
      setConsentSaving(false);
    }
  };

  // ── Pre-call screens ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <Shell>
        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        <p className="mt-3 text-sm text-white/60">Preparing your consultation...</p>
      </Shell>
    );
  }

  if (consentPatientId) {
    return (
      <Shell>
        <div className="rounded-2xl bg-white p-6 text-left text-gray-900 shadow-xl">
          <ShieldCheck className="h-8 w-8 text-[#0A6E75]" />
          <h1 className="mt-3 text-xl font-bold text-[#0D1F3C]">Before you join</h1>
          <p className="mt-2 text-sm text-gray-600">
            This consultation takes place by secure video. Your doctor will see and hear you, and
            may record clinical notes in your health record. The call itself is not recorded. You
            can withdraw this consent at any time from your profile.
          </p>
          <label className="mt-4 flex items-start gap-3 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#0A6E75]"
            />
            I consent to receiving care by video consultation.
          </label>
          <Button
            className="mt-5 w-full"
            disabled={!consentChecked || consentSaving}
            onClick={giveConsent}
          >
            {consentSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue to the call
          </Button>
        </div>
      </Shell>
    );
  }

  if (tooEarlyUntil) {
    const startsAt = new Date(tooEarlyUntil);
    return (
      <Shell>
        <Clock className="mx-auto h-10 w-10 text-white/70" />
        <h1 className="mt-4 text-xl font-bold">Your consultation hasn&apos;t started yet</h1>
        <p className="mt-2 text-sm text-white/70">
          It starts at {formatInstantWat(startsAt)}. The room opens 10 minutes before, and this page will let you in automatically.
        </p>
        <Button variant="outline" className="mt-5 text-[#0D1F3C]" onClick={() => router.push(getDashboardUrl(authUser?.role))}>
          Back to my portal
        </Button>
      </Shell>
    );
  }

  if (error || !meetingData) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">We couldn&apos;t connect you</h1>
        <p className="mt-2 text-sm text-white/70">{error || "The consultation could not be loaded."}</p>
        <div className="mt-5 flex justify-center gap-3">
          <Button
            variant="outline"
            className="text-[#0D1F3C]"
            onClick={() => {
              setCall(null);
              setJoinState("idle");
              setReloadKey((k) => k + 1);
            }}
          >
            Try again
          </Button>
          <Button onClick={() => router.push(getDashboardUrl(authUser?.role))} className="bg-[#0A6E75] hover:bg-[#085C62]">
            Go to my portal
          </Button>
        </div>
      </Shell>
    );
  }

  // ── In call ────────────────────────────────────────────────────────────────

  const otherPartyName = isDoctor ? meetingData.patient?.name : meetingData.doctor?.name;
  const otherPartyRole = isDoctor ? "Patient" : meetingData.doctor?.doctorProfile?.specialty?.name || "Doctor";
  const otherLocation = isDoctor ? meetingData.patientLocation : meetingData.doctorLocation;
  const startsAtMs = new Date(meetingData.startsAt).getTime();
  const elapsed = Math.floor((now - startsAtMs) / 1000);
  const network = NETWORK_LABEL[networkState];
  const remoteAudioMuted = remoteParticipant && remoteParticipant.tracks.audio.state === "off";

  return (
    <div className="flex h-dvh flex-col bg-gray-900 text-white">
      {/* Remote audio plays through a hidden element */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Header */}
      <div className="z-10 flex items-center justify-between gap-3 bg-[#0D1F3C] px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#5fc4ca]" />
          <span className="hidden text-lg font-semibold md:block">DFC Virtual Care</span>
          <span className="text-lg font-semibold md:hidden">DFC</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-sm">
          <Clock className="h-4 w-4" />
          {elapsed >= 0 ? formatDuration(elapsed) : `Starts in ${formatDuration(-elapsed)}`}
          <span className="hidden text-white/50 sm:inline">
            · {formatWatRange(meetingData.startTime, meetingData.endTime)}
          </span>
        </div>
        <div className={`flex items-center gap-1 ${joinState === "joined" ? network.className : "text-gray-400"}`}>
          <Signal className="h-5 w-5" />
          <span className="hidden text-xs md:inline">
            {joinState === "joined" ? network.text : "Connecting"}
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Video area */}
        <div className="relative flex flex-1 items-center justify-center bg-black p-2 md:p-4">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-gray-800">
            {/* Always mounted so the track attaches the moment it starts */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={remoteVideoTrack ? "h-full w-full object-contain" : "hidden"}
            />
            {!remoteVideoTrack && (
              <div className="flex flex-col items-center justify-center px-6 text-center">
                {joinState !== "joined" ? (
                  <>
                    <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#5fc4ca]" />
                    <span className="text-lg text-gray-300">Connecting to the secure room...</span>
                  </>
                ) : remoteParticipant ? (
                  <>
                    <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-gray-700">
                      <span className="text-4xl font-bold text-gray-300">{otherPartyName?.charAt(0)}</span>
                    </div>
                    <h3 className="text-2xl font-semibold">{otherPartyName}</h3>
                    <p className="mt-1 text-sm text-gray-400">Camera is off</p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex h-28 w-28 animate-pulse items-center justify-center rounded-full bg-gray-700">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold">Waiting for {otherPartyName} to join</h3>
                    <p className="mt-2 max-w-sm text-sm text-gray-400">
                      You&apos;re in the room. They will appear here as soon as they connect.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Remote name and status */}
            {remoteParticipant && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-4 pb-24 md:p-6 md:pb-28">
                <h3 className="text-lg font-semibold md:text-xl">{otherPartyName}</h3>
                <p className="flex items-center gap-2 text-sm text-gray-300">
                  {otherPartyRole}
                  {remoteAudioMuted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs">
                      <MicOff className="h-3 w-3" /> Muted
                    </span>
                  )}
                </p>
                {otherLocation && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3 w-3" /> Joining from: {otherLocation}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Local video (picture in picture) */}
          <div className="absolute right-4 top-4 z-20 h-24 w-20 overflow-hidden rounded-xl border-2 border-gray-700 bg-gray-900 shadow-2xl md:right-8 md:top-8 md:h-36 md:w-48">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`h-full w-full -scale-x-100 object-cover ${!videoEnabled || !localVideoTrack ? "hidden" : ""}`}
            />
            {(!videoEnabled || !localVideoTrack) && (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gray-800">
                <User className="mb-1 h-8 w-8 text-gray-500" />
                <span className="text-xs text-gray-500">{videoEnabled ? "Starting camera" : "Video off"}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gray-800/90 p-2 shadow-xl backdrop-blur md:bottom-8 md:gap-4 md:p-4">
            <Button
              variant={audioEnabled ? "secondary" : "destructive"}
              size="icon"
              className="h-11 w-11 rounded-full border border-gray-600 md:h-12 md:w-12"
              onClick={toggleAudio}
              aria-label={audioEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {audioEnabled ? <Mic className="h-5 w-5 md:h-6 md:w-6" /> : <MicOff className="h-5 w-5 md:h-6 md:w-6" />}
            </Button>
            <Button
              variant={videoEnabled ? "secondary" : "destructive"}
              size="icon"
              className="h-11 w-11 rounded-full border border-gray-600 md:h-12 md:w-12"
              onClick={toggleVideo}
              aria-label={videoEnabled ? "Turn camera off" : "Turn camera on"}
            >
              {videoEnabled ? <Video className="h-5 w-5 md:h-6 md:w-6" /> : <VideoOff className="h-5 w-5 md:h-6 md:w-6" />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full md:h-16 md:w-16"
              onClick={endCall}
              aria-label={isDoctor ? "End consultation" : "Leave call"}
              title={isDoctor ? "End consultation" : "Leave call"}
            >
              <PhoneOff className="h-5 w-5 md:h-8 md:w-8" />
            </Button>
          </div>

          {/* Scribe toggle (mobile), doctor only */}
          {isDoctor && (
            <Button
              className="absolute bottom-24 right-4 z-20 h-12 w-12 rounded-full bg-[#0A6E75] shadow-xl hover:bg-[#085C62] md:hidden"
              size="icon"
              aria-label="Open scribe"
              onClick={() => setShowScribePanel(!showScribePanel)}
            >
              <FileText className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* AI scribe panel, doctor only */}
        {isDoctor && (
          <div
            className={`${showScribePanel ? "fixed inset-0 z-40 md:relative" : "hidden"} w-full flex-col border-gray-700 bg-gray-800 md:flex md:w-96 md:border-l`}
          >
            <div className="border-b border-gray-700 bg-gray-800/50 p-4">
              <div className="flex items-center justify-between">
                <Button className="md:hidden" variant="ghost" size="icon" onClick={() => setShowScribePanel(false)} aria-label="Close scribe">
                  <span className="text-2xl">&times;</span>
                </Button>
                <h2 className="flex items-center gap-2 font-semibold">
                  <FileText className="h-4 w-4 text-[#5fc4ca]" />
                  AI Medical Scribe
                </h2>
                <Button
                  size="sm"
                  variant={isListening ? "default" : "outline"}
                  className={isListening ? "bg-[#0A6E75] hover:bg-[#085C62]" : "border-gray-600 bg-gray-700 hover:bg-gray-700"}
                  onClick={toggleScribe}
                  disabled={!recognitionRef.current}
                  title={recognitionRef.current ? undefined : "Speech recognition is not supported in this browser"}
                >
                  {isListening ? "Active" : "Start Scribe"}
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Live Transcript</label>
                <div className="min-h-[150px] whitespace-pre-wrap rounded-lg border border-gray-700 bg-gray-900 p-3 font-mono text-sm text-gray-300">
                  {transcript || <span className="italic text-gray-600">Start the scribe to transcribe your side of the consultation.</span>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Smart Notes</label>
                <textarea
                  className="min-h-[200px] w-full resize-none rounded-lg border border-gray-700 bg-gray-900 p-3 text-sm text-white outline-none focus:border-[#0A6E75] focus:ring-1 focus:ring-[#0A6E75]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key symptoms picked up from the transcript appear here. You can edit them."
                />
                <p className="text-xs text-gray-500">
                  When you end the consultation, the transcript and notes are saved as a draft encounter.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { getSpeechRecognition, SpeechRec } from "@/lib/speech";
import { speak, stopSpeaking } from "@/lib/tts";
import { Mic, MicOff, VideoOff, Video, Maximize2, AlertTriangle, PhoneOff, SkipForward } from "lucide-react";

type Turn = { role: "interviewer" | "candidate"; text: string };

const TIMER_SECONDS = 10 * 60;
const SILENCE_MS = 1400; // auto-advance after silence
const PER_QUESTION_SECONDS = 60; // hard cap per question — auto-advance

const LiveInterview = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [meta, setMeta] = useState<{ role: string; difficulty: string } | null>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [started, setStarted] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(PER_QUESTION_SECONDS);
  const [tabSwitchWarn, setTabSwitchWarn] = useState(0);
  const [camOn, setCamOn] = useState(true);

  const recRef = useRef<SpeechRec | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<number | null>(null);
  const finalTextRef = useRef("");
  const interimRef = useRef("");
  const transcriptRef = useRef<Turn[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => { if (!loading && !user) nav("/login"); }, [user, loading, nav]);

  // Load
  useEffect(() => {
    if (!id || !user) return;
    supabase.from("live_interviews").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error || !data) { toast.error("Session not found"); nav("/dashboard"); return; }
      if (data.status === "completed") { nav(`/live-results/${id}`); return; }
      setMeta({ role: data.role, difficulty: data.difficulty });
      const t = (data.transcript as any) ?? [];
      setTranscript(t);
      transcriptRef.current = t;
    });
  }, [id, user, nav]);

  // Anti-cheat: tab switch detection
  useEffect(() => {
    if (!started) return;
    const onVis = () => {
      if (document.hidden) {
        setTabSwitchWarn((n) => n + 1);
        toast.warning("Stay on this tab during the interview.");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [started]);

  // Webcam
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      // Recording
      try {
        const mr = new MediaRecorder(stream, { mimeType: "video/webm" });
        mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
        mediaRecRef.current = mr;
        mr.start(1000);
      } catch { /* recording optional */ }
      return true;
    } catch {
      toast.error("Camera/microphone permission required.");
      return false;
    }
  }, []);

  // Timer
  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(t); finishInterview(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  // Ask next AI question
  const fetchNextAI = useCallback(async () => {
    if (!meta) return;
    setAiSpeaking(true);
    try {
      const { data, error } = await supabase.functions.invoke("live-interview", {
        body: { mode: "next", role: meta.role, difficulty: meta.difficulty, transcript: transcriptRef.current, questionCount: 8 },
      });
      if (error) throw error;
      const text: string = data?.text ?? "Could you tell me more about that?";
      const isFinal: boolean = !!data?.is_final;
      const newTurn: Turn = { role: "interviewer", text };
      const next = [...transcriptRef.current, newTurn];
      transcriptRef.current = next;
      setTranscript(next);
      await supabase.from("live_interviews").update({ transcript: next as any }).eq("id", id!);
      speak(text, () => {
        setAiSpeaking(false);
        if (isFinal) finishInterview(false);
        else startListening();
      });
    } catch (e: any) {
      setAiSpeaking(false);
      toast.error(e.message ?? "AI failed to respond");
    }
  }, [meta, id]);

  // Speech recognition with silence detection
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = window.setTimeout(() => {
      submitAnswer();
    }, SILENCE_MS);
  }, []);

  const startListening = useCallback(() => {
    setInterim(""); setFinalText("");
    finalTextRef.current = ""; interimRef.current = "";
    const r = getSpeechRecognition(
      (i) => { interimRef.current = i; setInterim(i); resetSilenceTimer(); },
      (f) => {
        finalTextRef.current = (finalTextRef.current ? finalTextRef.current + " " : "") + f.trim();
        setFinalText(finalTextRef.current);
        resetSilenceTimer();
      },
      (e) => { if (e !== "no-speech") console.warn("speech err", e); },
    );
    if (!r) { toast.error("Speech recognition not supported. Use Chrome."); return; }
    recRef.current = r;
    r.start();
    setListening(true);
    resetSilenceTimer();
  }, [resetSilenceTimer]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }, []);

  const submitAnswer = useCallback(async (opts?: { skipped?: boolean }) => {
    stopListening();
    const answer = (finalTextRef.current + " " + interimRef.current).trim();
    if (opts?.skipped) {
      const next: Turn[] = [...transcriptRef.current, { role: "candidate", text: "(skipped)" }];
      transcriptRef.current = next; setTranscript(next);
      await supabase.from("live_interviews").update({ transcript: next as any }).eq("id", id!);
    } else if (!answer) {
      const next: Turn[] = [...transcriptRef.current, { role: "candidate", text: "(no audible response)" }];
      transcriptRef.current = next; setTranscript(next);
      await supabase.from("live_interviews").update({ transcript: next as any }).eq("id", id!);
    } else {
      const next: Turn[] = [...transcriptRef.current, { role: "candidate", text: answer }];
      transcriptRef.current = next; setTranscript(next);
      await supabase.from("live_interviews").update({ transcript: next as any }).eq("id", id!);
    }
    setFinalText(""); setInterim("");
    finalTextRef.current = ""; interimRef.current = "";
    fetchNextAI();
  }, [fetchNextAI, id, stopListening]);

  // Per-question countdown — auto-advance when expires
  useEffect(() => {
    if (!started || aiSpeaking || finishing) return;
    if (!listening) return;
    setQuestionSecondsLeft(PER_QUESTION_SECONDS);
    const t = setInterval(() => {
      setQuestionSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submitAnswer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, aiSpeaking, finishing, listening, submitAnswer]);

  // Begin
  const begin = async () => {
    const ok = await initCamera();
    if (!ok) return;
    setStarted(true);
    startTimeRef.current = Date.now();
    if (document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); } catch { /* ignore */ }
    }
    setTimeout(() => fetchNextAI(), 300);
  };

  // End / finish
  const finishInterview = useCallback(async (timeout: boolean) => {
    if (finishing) return;
    setFinishing(true);
    stopListening();
    stopSpeaking();
    setAiSpeaking(false);

    // Stop recording, upload
    let recordingUrl: string | null = null;
    try {
      if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") {
        await new Promise<void>((res) => {
          mediaRecRef.current!.onstop = () => res();
          mediaRecRef.current!.stop();
        });
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (chunksRef.current.length && user && id) {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const path = `${user.id}/${id}.webm`;
        const { error: upErr } = await supabase.storage.from("interview-recordings").upload(path, blob, { upsert: true, contentType: "video/webm" });
        if (!upErr) recordingUrl = path;
      }
    } catch (e) { console.warn("recording upload failed", e); }

    try {
      const { data, error } = await supabase.functions.invoke("live-interview", {
        body: { mode: "final", role: meta?.role, difficulty: meta?.difficulty, transcript: transcriptRef.current },
      });
      if (error) throw error;
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      await supabase.from("live_interviews").update({
        total_score: data.total_score,
        technical_score: data.technical_score,
        communication_score: data.communication_score,
        confidence_score: data.confidence_score,
        grammar_score: data.grammar_score,
        clarity_score: data.clarity_score,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        suggestions: data.suggestions,
        improved_answers: data.improved_answers as any,
        summary: data.summary,
        recording_url: recordingUrl,
        status: "completed",
        duration_seconds: duration,
        completed_at: new Date().toISOString(),
      }).eq("id", id!);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      nav(`/live-results/${id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Could not finalize");
      setFinishing(false);
    }
  }, [finishing, id, meta, nav, stopListening, user]);

  if (loading || !meta) return <div className="min-h-screen bg-background" />;

  // Pre-start screen
  if (!started) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-xl w-full p-10 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">You're about to begin</p>
          <h1 className="font-serif text-4xl mb-3">{meta.role}</h1>
          <p className="text-muted-foreground mb-8">{meta.difficulty} difficulty · 10 minutes · ~8 questions</p>
          <div className="text-left space-y-3 text-sm text-muted-foreground mb-8">
            <p className="flex gap-3"><AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" /> Camera & microphone are required.</p>
            <p className="flex gap-3"><AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" /> Stay on this tab. Switching is logged.</p>
            <p className="flex gap-3"><AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" /> The interviewer will speak. Answer naturally; she'll move on after a brief pause.</p>
          </div>
          <Button onClick={begin} size="lg" className="w-full">I'm ready — begin interview</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between bg-card/70 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live interview</p>
          <p className="font-serif text-lg leading-tight">{meta.role} · {meta.difficulty}</p>
        </div>
        <div className="flex items-center gap-6">
          {tabSwitchWarn > 0 && (
            <span className="text-xs text-destructive flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {tabSwitchWarn} tab switch{tabSwitchWarn>1?"es":""}</span>
          )}
          <div className={`font-mono text-2xl tabular-nums ${secondsLeft < 60 ? "text-destructive" : ""}`}>{fmt(secondsLeft)}</div>
          <Button onClick={() => finishInterview(false)} variant="destructive" size="sm" disabled={finishing}>
            <PhoneOff className="w-4 h-4 mr-2" />{finishing ? "Finishing…" : "End"}
          </Button>
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-2 gap-4 p-4">
        {/* AI interviewer */}
        <Card className="relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-accent/5 via-card to-secondary/40 min-h-[320px]">
          <div className="absolute top-3 left-3 text-xs uppercase tracking-wider text-muted-foreground">Interviewer · Aria</div>
          <motion.div
            animate={aiSpeaking ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 1.2, repeat: aiSpeaking ? Infinity : 0 }}
            className="relative"
          >
            <div className="w-44 h-44 rounded-full bg-gradient-to-br from-accent to-accent/40 flex items-center justify-center shadow-xl">
              <span className="font-serif text-7xl text-accent-foreground">A</span>
            </div>
            {aiSpeaking && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-accent"
                animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            )}
          </motion.div>
          <p className="mt-6 text-sm text-muted-foreground">{aiSpeaking ? "Speaking…" : listening ? "Listening to you" : "…"}</p>
        </Card>

        {/* Candidate webcam */}
        <Card className="relative overflow-hidden bg-black min-h-[320px]">
          <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${camOn ? "" : "hidden"}`} />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Camera off</div>
          )}
          <div className="absolute top-3 left-3 text-xs uppercase tracking-wider text-white/70">You</div>
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full backdrop-blur ${listening ? "bg-destructive/80 text-destructive-foreground" : "bg-black/40 text-white"}`}>
              {listening ? "● REC" : "Idle"}
            </span>
          </div>
        </Card>
      </main>

      {/* Transcript & controls */}
      <section className="border-t border-border bg-card/60 backdrop-blur p-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4 mb-3">
            <div className="md:col-span-2">
              <div className="flex items-baseline justify-between mb-1.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Current question</p>
                {listening && !aiSpeaking && (
                  <p className={`text-xs font-mono tabular-nums ${questionSecondsLeft < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                    {questionSecondsLeft}s left · auto-skip
                  </p>
                )}
              </div>
              <p className="font-serif text-lg leading-snug min-h-[2.5em]">
                {transcript.filter(t => t.role === "interviewer").slice(-1)[0]?.text ?? "…"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Live transcript</p>
              <div className="text-sm min-h-[2.5em] max-h-20 overflow-y-auto">
                <span>{finalText}</span>{" "}
                <span className="text-muted-foreground italic">{interim}</span>
                {!finalText && !interim && <span className="text-muted-foreground italic">{listening ? "…" : ""}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-center">
            <Button onClick={() => listening ? stopListening() : startListening()} variant="outline" size="sm" disabled={aiSpeaking || finishing}>
              {listening ? <><MicOff className="w-4 h-4 mr-2" />Mute</> : <><Mic className="w-4 h-4 mr-2" />Unmute</>}
            </Button>
            <Button onClick={() => {
              const tracks = streamRef.current?.getVideoTracks() ?? [];
              tracks.forEach(t => t.enabled = !t.enabled);
              setCamOn(c => !c);
            }} variant="outline" size="sm">
              {camOn ? <><VideoOff className="w-4 h-4 mr-2" />Camera off</> : <><Video className="w-4 h-4 mr-2" />Camera on</>}
            </Button>
            <Button onClick={() => document.documentElement.requestFullscreen?.()} variant="outline" size="sm">
              <Maximize2 className="w-4 h-4 mr-2" />Fullscreen
            </Button>
            <Button onClick={() => submitAnswer({ skipped: true })} variant="outline" size="sm" disabled={aiSpeaking || finishing}>
              <SkipForward className="w-4 h-4 mr-2" />Skip
            </Button>
            <Button onClick={() => submitAnswer()} variant="default" size="sm" disabled={aiSpeaking || finishing || (!finalText && !interim)}>
              Submit answer →
            </Button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {finishing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur flex items-center justify-center z-50">
            <Card className="p-10 text-center">
              <p className="font-serif text-3xl mb-2">Compiling your scorecard…</p>
              <p className="text-sm text-muted-foreground">Analyzing transcript, scoring 5 dimensions.</p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveInterview;

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { getSpeechRecognition, SpeechRec } from "@/lib/speech";
import { Mic, MicOff, Circle, Square } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Question = { question: string; category: string; options?: string[]; correct_index?: number };
type PerQ = { question: string; answer: string; score: number; feedback: string; ideal_answer: string; is_mcq?: boolean; is_correct?: boolean; correct_answer?: string };

const Interview = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [meta, setMeta] = useState<{ role: string; difficulty: string; questions: Question[] } | null>(null);
  const [idx, setIdx] = useState(0);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const [typedText, setTypedText] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [listening, setListening] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [perQ, setPerQ] = useState<PerQ[]>([]);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  // Recording
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => {
    if (!loading && !user) nav("/login");
  }, [user, loading, nav]);

  useEffect(() => {
    if (!id || !user) return;
    supabase.from("interviews").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error || !data) { toast.error("Interview not found"); nav("/dashboard"); return; }
      if (data.status === "completed") { nav(`/results/${id}`); return; }
      setMeta({ role: data.role, difficulty: data.difficulty, questions: data.questions as any });
      setPerQ((data.per_question as any) ?? []);
      setIdx(((data.per_question as any)?.length) ?? 0);
    });
  }, [id, user, nav]);

  const startListening = () => {
    setInterim(""); setFinalText(""); setLastFeedback(null);
    const r = getSpeechRecognition(
      (i) => setInterim(i),
      (f) => setFinalText((p) => (p ? p + " " : "") + f.trim()),
      (e) => toast.error("Mic: " + e),
    );
    if (!r) { toast.error("Speech recognition not supported in this browser. Try Chrome."); return; }
    recRef.current = r;
    r.start();
    setListening(true);
  };

  const stopListening = () => {
    recRef.current?.stop();
    setListening(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordingUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const submitAnswer = async () => {
    if (!meta || !id) return;
    if (listening) stopListening();
    if (recording) stopRecording();
    const q = meta.questions[idx];
    const hasOptions = !!(q.options && q.options.length);
    const answerText = hasOptions
      ? selectedOption.trim()
      : (typedText.trim() || (finalText + " " + interim).trim());
    if (!answerText) { toast.error("Please provide an answer"); return; }

    setEvaluating(true);
    try {
      let next: PerQ;

      if (hasOptions) {
        // MCQ: local evaluation — no AI call needed
        const selectedIdx = q.options!.indexOf(selectedOption);
        const isCorrect = selectedIdx === q.correct_index;
        const correctAnswer = q.correct_index != null ? q.options![q.correct_index] : "";
        next = {
          question: q.question,
          answer: selectedOption,
          score: isCorrect ? 1 : 0,
          feedback: isCorrect
            ? "Correct! Well done."
            : `Incorrect. The correct answer was: "${correctAnswer}".`,
          ideal_answer: correctAnswer,
          is_mcq: true,
          is_correct: isCorrect,
          correct_answer: correctAnswer,
        };
        setLastFeedback(isCorrect ? "✓ Correct!" : `✗ Incorrect — Correct answer: "${correctAnswer}"`);
      } else {
        // Open-ended: use AI evaluation
        const { data, error } = await supabase.functions.invoke("evaluate-answer", {
          body: { role: meta.role, difficulty: meta.difficulty, question: q.question, answer: answerText },
        });
        if (error) throw error;
        next = { question: q.question, answer: answerText, score: data.score, feedback: data.feedback, ideal_answer: data.ideal_answer };
        setLastFeedback(`Score ${data.score}/100 · ${data.feedback}`);
      }

      const newPerQ = [...perQ, next];
      setPerQ(newPerQ);

      const isLast = idx + 1 >= meta.questions.length;

      if (isLast) {
        // Check if all questions are MCQ
        const allMcq = newPerQ.every(p => p.is_mcq);
        let totalScore: number, techScore: number, commScore: number;
        let strengths: string[], weaknesses: string[], summary: string;

        if (allMcq) {
          // Pure MCQ: calculate scores based on correct answers
          const correct = newPerQ.filter(p => p.is_correct).length;
          const total = newPerQ.length;
          totalScore = Math.round((correct / total) * 100);
          techScore = totalScore;
          commScore = 100; // MCQ doesn't test communication
          strengths = correct > 0 ? [`Got ${correct} out of ${total} questions correct`] : ["Attempted all questions"];
          weaknesses = correct < total ? [`Missed ${total - correct} out of ${total} questions`] : ["Keep practicing to maintain your score"];
          summary = `Scored ${correct}/${total} (${totalScore}%) on the MCQ round.`;
        } else {
          // Mixed or open-ended: use AI final evaluation
          const { data: final, error: fErr } = await supabase.functions.invoke("evaluate-answer", {
            body: { role: meta.role, difficulty: meta.difficulty, mode: "final", answer: newPerQ },
          });
          if (fErr) throw fErr;
          totalScore = final.total_score;
          techScore = final.technical_score;
          commScore = final.communication_score;
          strengths = final.strengths;
          weaknesses = final.weaknesses;
          summary = final.summary;
        }

        await supabase.from("interviews").update({
          per_question: newPerQ as any,
          answers: newPerQ.map(p => p.answer) as any,
          total_score: totalScore,
          technical_score: techScore,
          communication_score: commScore,
          strengths,
          weaknesses,
          summary,
          status: "completed",
          completed_at: new Date().toISOString(),
        }).eq("id", id);
        nav(`/results/${id}`);
      } else {
        await supabase.from("interviews").update({ per_question: newPerQ as any }).eq("id", id);
        setIdx(idx + 1);
        setFinalText(""); setInterim(""); setTypedText(""); setSelectedOption("");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  if (loading || !meta) return <div className="min-h-screen bg-background" />;

  const q = meta.questions[idx];
  const hasOptions = !!(q.options && q.options.length);
  const progress = ((idx) / meta.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-12 max-w-4xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {meta.role} · {meta.difficulty}
          </p>
          <p className="text-sm text-muted-foreground">Question {idx + 1} of {meta.questions.length}</p>
        </div>
        <Progress value={progress} className="mb-12 h-1" />

        <Card className="p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">{q.category}</p>
          <h2 className="font-serif text-4xl leading-tight mb-10">{q.question}</h2>

          {hasOptions ? (
            <div className="mb-6">
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="gap-3">
                {q.options!.map((opt, i) => (
                  <Label
                    key={i}
                    htmlFor={`opt-${i}`}
                    className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${selectedOption === opt ? "border-accent bg-accent/5" : "border-border hover:bg-muted/50"}`}
                  >
                    <RadioGroupItem value={opt} id={`opt-${i}`} className="mt-0.5" />
                    <span className="text-base font-normal leading-relaxed">
                      <span className="text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          ) : (
            <>
              <Textarea
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Type your answer here, or use the mic to speak."
                className="min-h-[140px] mb-4 text-base"
              />
              <div className="min-h-[60px] p-4 bg-muted/50 border border-border mb-6 text-sm">
                {finalText || interim ? (
                  <p className="leading-relaxed">
                    <span>{finalText}</span>{" "}
                    <span className="text-muted-foreground italic">{interim}</span>
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {listening ? <span className="pulse-dot">Listening… (speech will be appended on submit if textarea is empty)</span> : "Press the mic to dictate, or just type above."}
                  </p>
                )}
              </div>
            </>
          )}

          {lastFeedback && (
            <div className="mb-6 p-4 border-l-2 border-accent bg-accent/5 text-sm">{lastFeedback}</div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {!hasOptions && (
              <>
                {!listening ? (
                  <Button onClick={startListening} variant="outline" size="lg"><Mic className="w-4 h-4 mr-2" /> Start speaking</Button>
                ) : (
                  <Button onClick={stopListening} variant="secondary" size="lg"><MicOff className="w-4 h-4 mr-2" /> Stop</Button>
                )}

                {!recording ? (
                  <Button onClick={startRecording} variant="outline" size="lg"><Circle className="w-3 h-3 mr-2 fill-destructive text-destructive" /> Record audio</Button>
                ) : (
                  <Button onClick={stopRecording} variant="outline" size="lg"><Square className="w-3 h-3 mr-2" /> Stop recording</Button>
                )}
              </>
            )}

            <div className="ml-auto">
              <Button
                onClick={submitAnswer}
                disabled={evaluating || (hasOptions ? !selectedOption : (!typedText.trim() && !finalText && !interim))}
                size="lg"
                variant="default"
              >
                {evaluating ? "Evaluating…" : idx + 1 === meta.questions.length ? "Finish interview" : "Next question"}
              </Button>
            </div>
          </div>

          {recordingUrl && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recording</p>
              <audio src={recordingUrl} controls className="w-full" />
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Interview;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const McqSetup = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState("Frontend");
  const [difficulty, setDifficulty] = useState("Mid");
  const [count, setCount] = useState("6");
  const [starting, setStarting] = useState(false);

  const start = async () => {
    if (!user) return;
    setStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { role, difficulty, count: parseInt(count) },
      });
      if (error) throw error;
      const questions = data?.questions ?? [];
      if (!questions.length) throw new Error("No questions generated");
      const { data: row, error: insErr } = await supabase.from("interviews").insert({
        user_id: user.id, role, difficulty, questions, status: "in_progress",
      }).select("id").single();
      if (insErr) throw insErr;
      nav(`/interview/${row.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to start");
    } finally { setStarting(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-16 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">Mode 01 · MCQ</p>
        <h1 className="font-serif text-5xl mb-12">Set up your interview.</h1>
        <Card className="p-10 space-y-6">
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Frontend","Backend","DevOps","Full-stack","Data"].map(r => <SelectItem key={r} value={r}>{r} Engineer</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Junior","Mid","Senior","Staff"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Questions</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5,6,7,8,9,10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={start} disabled={starting} className="w-full" size="lg">
            {starting ? "Preparing…" : "Begin interview"}
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default McqSetup;

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { ArrowRight, Mic, Video } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

type AnyInterview = {
  id: string;
  role: string;
  difficulty: string;
  total_score: number | null;
  status: string;
  created_at: string;
  source: "mcq" | "live";
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [history, setHistory] = useState<AnyInterview[]>([]);

  useEffect(() => { if (!loading && !user) nav("/login"); }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("interviews").select("id,role,difficulty,total_score,status,created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("live_interviews").select("id,role,difficulty,total_score,status,created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]).then(([a, b]) => {
      const merged: AnyInterview[] = [
        ...((a.data ?? []).map((r: any) => ({ ...r, source: "mcq" as const }))),
        ...((b.data ?? []).map((r: any) => ({ ...r, source: "live" as const }))),
      ].sort((x, y) => +new Date(y.created_at) - +new Date(x.created_at));
      setHistory(merged);
    });
  }, [user]);

  const chartData = [...history].reverse().filter(h => h.total_score != null).map((h, i) => ({
    n: i + 1, score: h.total_score, mode: h.source,
  }));

  if (loading) return <div className="min-h-screen bg-background" />;

  const Mode = ({ to, icon: Icon, kicker, title, desc }: any) => (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
      <Link to={to}>
        <Card className="p-10 h-full group cursor-pointer relative overflow-hidden border hover:border-accent transition-colors">
          <div className="flex items-center gap-3 text-accent mb-6"><Icon className="w-5 h-5" /><p className="text-xs uppercase tracking-[0.2em]">{kicker}</p></div>
          <h3 className="font-serif text-3xl mb-3 leading-tight">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">{desc}</p>
          <div className="flex items-center gap-2 text-sm font-medium text-accent">
            Begin <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-16">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">№ 03 — Studio</p>
        <h1 className="font-serif text-5xl mb-12">Choose your interview.</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <Mode
            to="/mcq-setup"
            icon={Mic}
            kicker="Mode 01"
            title="MCQ Interview"
            desc="Voice-answered questions, scored one by one. Best for structured practice on a specific role."
          />
          <Mode
            to="/live-setup"
            icon={Video}
            kicker="Mode 02 · New"
            title="Live AI Interview"
            desc="Conversational interview with a realistic AI interviewer. Webcam, mic, follow-up questions, and a full scorecard."
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="p-8 lg:col-span-2">
            <h2 className="font-serif text-2xl mb-6">Progress</h2>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <XAxis dataKey="n" stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Complete a few interviews to see your trajectory.</p>
            )}
          </Card>

          <Card className="p-8">
            <h2 className="font-serif text-2xl mb-6">History</h2>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
            ) : (
              <div className="divide-y divide-border max-h-[260px] overflow-y-auto">
                {history.map(h => {
                  const path = h.source === "live"
                    ? (h.status === "completed" ? `/live-results/${h.id}` : `/live/${h.id}`)
                    : (h.status === "completed" ? `/results/${h.id}` : `/interview/${h.id}`);
                  return (
                    <Link key={h.id} to={path} className="flex items-center justify-between py-3 hover:text-accent transition-colors">
                      <div>
                        <p className="font-serif text-base">{h.role} <span className="text-muted-foreground text-xs">· {h.source === "live" ? "Live" : "MCQ"}</span></p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          {new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {h.status === "completed" ? "Done" : "In progress"}
                        </p>
                      </div>
                      <p className="font-serif text-2xl">{h.total_score ?? "—"}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

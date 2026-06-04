import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Code, Server, Layers, Cloud, BarChart3, Coffee, Atom, Cog } from "lucide-react";

const ROLES = [
  { id: "Frontend Developer", icon: Code },
  { id: "Backend Developer", icon: Server },
  { id: "Full Stack Developer", icon: Layers },
  { id: "DevOps Engineer", icon: Cloud },
  { id: "Data Analyst", icon: BarChart3 },
  { id: "Java Developer", icon: Coffee },
  { id: "React Developer", icon: Atom },
  { id: "Node.js Developer", icon: Cog },
];

const DIFF = ["Easy", "Medium", "Hard"];

const LiveSetup = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState<string>("Frontend Developer");
  const [difficulty, setDifficulty] = useState<string>("Medium");
  const [starting, setStarting] = useState(false);

  const start = async () => {
    if (!user) return;
    setStarting(true);
    try {
      const { data: row, error } = await supabase.from("live_interviews").insert({
        user_id: user.id, role, difficulty, status: "in_progress",
      }).select("id").single();
      if (error) throw error;
      nav(`/live/${row.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Could not start");
    } finally { setStarting(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-16 max-w-4xl">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">Mode 02 · Live AI</p>
        <h1 className="font-serif text-5xl mb-12">Configure your session.</h1>

        <Card className="p-10 mb-8">
          <h2 className="font-serif text-2xl mb-6">Select role</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROLES.map(({ id, icon: Icon }) => (
              <motion.button
                key={id}
                whileHover={{ y: -2 }}
                onClick={() => setRole(id)}
                className={`p-4 border text-left transition-colors ${role === id ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}
              >
                <Icon className="w-5 h-5 mb-3 text-accent" />
                <p className="text-sm font-medium leading-tight">{id}</p>
              </motion.button>
            ))}
          </div>
        </Card>

        <Card className="p-10 mb-8">
          <h2 className="font-serif text-2xl mb-6">Select difficulty</h2>
          <div className="grid grid-cols-3 gap-3">
            {DIFF.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`p-6 border text-center transition-colors ${difficulty === d ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}
              >
                <p className="font-serif text-2xl">{d}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={start} disabled={starting} size="lg">
            {starting ? "Starting…" : "Enter the room →"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default LiveSetup;

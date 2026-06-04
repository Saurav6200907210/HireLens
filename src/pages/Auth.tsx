import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  name: z.string().trim().min(1).max(80).optional(),
});

const Auth = ({ mode }: { mode: "login" | "signup" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, name: mode === "signup" ? name : undefined });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Welcome aboard.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      nav("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-20 max-w-md">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">{mode === "signup" ? "№ 02 — Begin" : "№ 02 — Return"}</p>
        <h1 className="font-serif text-5xl mb-10">{mode === "signup" ? "Create account" : "Sign in"}</h1>

        <form onSubmit={submit} className="space-y-5">
          {mode === "signup" && (
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-6">
          {mode === "signup" ? (
            <>Already have an account? <Link to="/login" className="text-accent underline">Sign in</Link></>
          ) : (
            <>New here? <Link to="/signup" className="text-accent underline">Create one</Link></>
          )}
        </p>
      </main>
    </div>
  );
};

export default Auth;

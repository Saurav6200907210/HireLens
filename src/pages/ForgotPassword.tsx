import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email().max(255),
});

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Password reset email sent!");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-20 max-w-md">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">№ 03 — Recovery</p>
        <h1 className="font-serif text-5xl mb-10">Reset Password</h1>

        {!submitted ? (
          <form onSubmit={submit} className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending link…" : "Send reset link"}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              We've sent a password reset link to <strong>{email}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Didn't receive it? Check your spam folder or try again.
            </p>
            <Button variant="outline" onClick={() => setSubmitted(false)} className="mt-4">
              Try another email
            </Button>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mt-6 text-center">
          Remember your password? <Link to="/login" className="text-accent underline">Sign in</Link>
        </p>
      </main>
    </div>
  );
};

export default ForgotPassword;

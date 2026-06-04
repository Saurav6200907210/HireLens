import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-24">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-6">№ 01 — The interview, reimagined</p>
          <h1 className="font-serif text-6xl md:text-7xl leading-[0.95] mb-8">
            Practice interviews,<br/>
            <em className="text-accent not-italic">spoken</em> aloud.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
            An AI interviewer that listens, scores, and coaches. Choose a role, answer with your voice, and walk away with feedback worth keeping.
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg"><Link to={user ? "/dashboard" : "/signup"}>Begin a session</Link></Button>
            <Button asChild size="lg" variant="ghost"><Link to="/login">Sign in</Link></Button>
          </div>
        </div>

        <div className="editorial-rule mt-24 pt-12 grid md:grid-cols-3 gap-12">
          {[
            { n: "I.", t: "Speak naturally", d: "Live transcription via your browser. No setup, no plugins." },
            { n: "II.", t: "Honest scoring", d: "Per-question feedback, technical and communication scores out of 100." },
            { n: "III.", t: "Track progress", d: "Every attempt saved. Watch your scores climb across sessions." },
          ].map((f) => (
            <div key={f.n}>
              <p className="font-serif text-3xl text-accent mb-3">{f.n}</p>
              <h3 className="font-serif text-xl mb-2">{f.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;

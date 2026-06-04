import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const SiteHeader = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <header className="border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-serif text-2xl tracking-tight">
          <img src="/hirelens-icon.png" alt="HireLens Icon" className="w-8 h-8 object-contain" />
          <span>HireLens<span className="text-accent">.</span></span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav("/"); }}>Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-accent transition-colors">Sign in</Link>
              <Button asChild size="sm" variant="default"><Link to="/signup">Get started</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Github } from "lucide-react";

export const SiteHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (location.pathname === "/") {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: "Features", href: "#features", id: "features" },
    { label: "How it Works", href: "#how-it-works", id: "how-it-works" },
    { label: "Pricing", href: "#pricing", id: "pricing" },
    { label: "FAQ", href: "#faq", id: "faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "py-3 bg-[#FAF7F2]/80 backdrop-blur-md border-b border-[#ECE5DE]/60 shadow-sm"
          : "py-5 bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container max-w-7xl mx-auto flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-serif text-2xl tracking-tight text-[#2C211A]">
          <img src="/hirelens-icon.png" alt="HireLens Icon" className="w-8 h-8 object-contain" />
          <span className="font-semibold">
            HireLens<span className="text-[#E86D36]">.</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#2C211A]/80">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.id)}
              className="hover:text-[#E86D36] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#E86D36] after:transition-all hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#E86D36] transition-colors flex items-center gap-1.5"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-[#2C211A] hover:text-[#E86D36] font-medium">
                  Dashboard
                </Button>
              </Link>
              <Button
                size="sm"
                className="bg-[#2C211A] text-[#FAF7F2] hover:bg-[#2C211A]/95"
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-[#2C211A]/80 hover:text-[#E86D36] transition-colors">
                Sign in
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-[#E86D36] text-white hover:bg-[#E86D36]/90 border border-[#E86D36]/25 shadow-sm">
                  Start Free
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 text-[#2C211A] hover:text-[#E86D36] transition-colors focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#FAF7F2]/95 backdrop-blur-lg border-b border-[#ECE5DE]/80"
          >
            <div className="container px-6 py-6 flex flex-col gap-5 text-base font-medium">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.id)}
                  className="hover:text-[#E86D36] transition-colors py-1.5 border-b border-[#ECE5DE]/30"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#E86D36] transition-colors py-1.5 border-b border-[#ECE5DE]/30 flex items-center gap-2"
              >
                <Github className="w-5 h-5" />
                <span>GitHub</span>
              </a>

              <div className="flex flex-col gap-3 pt-3">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-center">
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      className="w-full justify-center bg-[#2C211A] text-[#FAF7F2]"
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        await signOut();
                        navigate("/");
                      }}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-center border-[#ECE5DE]">
                        Sign in
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full justify-center bg-[#E86D36] text-white hover:bg-[#E86D36]/90">
                        Start Free
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, Globe } from "lucide-react";

export const SiteFooter = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-[#FAF7F2] border-t border-[#ECE5DE] pt-16 pb-8">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Logo & Pitch */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-serif text-2xl tracking-tight text-[#2C211A] mb-4">
              <img src="/hirelens-icon.png" alt="HireLens Icon" className="w-7 h-7 object-contain" />
              <span className="font-semibold">HireLens<span className="text-[#E86D36]">.</span></span>
            </Link>
            <p className="text-sm text-[#2C211A]/70 max-w-sm leading-relaxed mb-6">
              Empowering candidates and teams with instant, bias-free spoken interviews powered by advanced recruiter AI agents.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-[#2C211A]/60 hover:text-[#E86D36] transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-[#2C211A]/60 hover:text-[#E86D36] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-[#2C211A]/60 hover:text-[#E86D36] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://hirelens.ai" target="_blank" rel="noreferrer" className="text-[#2C211A]/60 hover:text-[#E86D36] transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links: Resources */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-[#2C211A]/50 mb-4">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="https://github.com" className="text-[#2C211A]/80 hover:text-[#E86D36] transition-colors">
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-[#2C211A]/80 hover:text-[#E86D36] transition-colors">
                  Documentation & Guide
                </a>
              </li>
              <li>
                <a href="#features" className="text-[#2C211A]/80 hover:text-[#E86D36] transition-colors">
                  Features Overview
                </a>
              </li>
            </ul>
          </div>

          {/* Links: Legal & Contact */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-[#2C211A]/50 mb-4">Legal & Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-[#2C211A]/80 hover:text-[#E86D36] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-[#2C211A]/80 hover:text-[#E86D36] transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="mailto:support@hirelens.com" className="text-[#2C211A]/80 hover:text-[#E86D36] transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#ECE5DE] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#2C211A]/60">
          <p>&copy; {year} HireLens. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for recruiters & candidate growth.
          </p>
        </div>
      </div>
    </footer>
  );
};

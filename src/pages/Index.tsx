import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";
import {
  Mic,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileText,
  Video,
  Award,
  Check,
  X,
  Star,
  Play,
  ArrowRight,
  UserCheck,
  Cpu,
  Brain,
  Volume2,
  CheckCircle2,
  HelpCircle,
  FolderDown,
  LineChart,
  ArrowUpRight,
  ChevronDown
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

// Helper components for stats counters
const AnimatedCounter = ({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      if (start === end) return;

      const totalMiliseconds = duration * 1000;
      const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 15);
      
      const timer = setInterval(() => {
        start += Math.ceil(end / (totalMiliseconds / incrementTime));
        if (start >= end) {
          clearInterval(timer);
          setCount(end);
        } else {
          setCount(start);
        }
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="font-numbers font-bold text-4xl md:text-5xl text-[#2C211A] tracking-tight">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

// Tilt Card wrapper for mouse hover effect
const TiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const box = cardRef.current.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    // Tilt limits
    setRotateX(-y / 15);
    setRotateY(x / 15);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States for interactive live demo
  const [demoState, setDemoState] = useState<"idle" | "playing" | "done">("idle");
  const [demoProgress, setDemoProgress] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Scroll logic for Timeline/How it works
  const timelineRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start end", "end end"],
  });

  const pathLength = useTransform(scrollYProgress, [0.1, 0.9], [0, 1]);

  // Sample data for charts
  const performanceTrendData = [
    { session: "S1", score: 68 },
    { session: "S2", score: 72 },
    { session: "S3", score: 78 },
    { session: "S4", score: 81 },
    { session: "S5", score: 87 },
    { session: "S6", score: 92 },
  ];

  const skillData = [
    { subject: "Technical Depth", A: 85, fullMark: 100 },
    { subject: "Communication", A: 78, fullMark: 100 },
    { subject: "Grammar & Flow", A: 90, fullMark: 100 },
    { subject: "Structure", A: 82, fullMark: 100 },
    { subject: "Confidence", A: 88, fullMark: 100 },
  ];

  // Simulated live demo play sequence
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (demoState === "playing") {
      setDemoProgress(0);
      const interval = setInterval(() => {
        setDemoProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setDemoState("done");
            return 100;
          }
          return prev + 2.5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [demoState]);

  const toggleDemo = () => {
    if (demoState === "playing") {
      setDemoState("idle");
      setDemoProgress(0);
    } else {
      setDemoState("playing");
    }
  };

  const faqs = [
    {
      q: "How does the AI recruiter conduct the interview?",
      a: "The HireLens AI interviewer utilizes real-time speech synthesis to ask you domain-specific questions based on your resume. You respond verbally through your microphone, and our AI transcribes, scores, and analyzes your answers in real time."
    },
    {
      q: "Can I practice interviews specific to my resume?",
      a: "Absolutely. Simply upload your PDF resume, specify the role you are targeting, and our AI parses your background to generate custom-tailored, realistic technical and behavioral questions."
    },
    {
      q: "What metrics are included in the feedback report?",
      a: "Every session generates an instant premium report scoring your Technical Knowledge, Communication Skills, Confidence Levels, Grammar, and Response Structure, along with specific improvement suggestions."
    },
    {
      q: "Is there a limit to how many interviews I can practice?",
      a: "Our Free Tier offers complete starting mock interviews. You can upgrade to a premium plan to gain access to unlimited interviews, advanced dashboard analytics, and deep industry-specific recruiters."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Jenkins",
      role: "Software Engineering Intern",
      company: "Incoming at Microsoft",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      rating: 5,
      text: "HireLens changed how I prepped. The verbal voice simulation felt exactly like a real screen call, and the suggestions helped me refine my system design descriptions."
    },
    {
      name: "David Chen",
      role: "Frontend Developer",
      company: "Vercel",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      rating: 5,
      text: "Getting instant scoring on my communication speed and content correctness helped me speak more confidently. Highly recommended for devs!"
    },
    {
      name: "Priya Nair",
      role: "Graduate Candidate",
      company: "Google",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      rating: 5,
      text: "The resume-based questions were incredibly accurate. It asked me about specific projects from my GitHub and grilled me on the architecture."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C211A] overflow-x-hidden">
      <SiteHeader />

      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E86D36]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-[#2C211A]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Side: Headline & Copy */}
            <div className="lg:col-span-6 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-[#ECE5DE] text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#E86D36]" />
                  <span>Next-Gen Spoken Mock Practice</span>
                </div>

                <h1 className="font-serif text-5xl sm:text-6xl lg:text-[4.5rem] leading-[1.05] tracking-tight font-semibold mb-6">
                  Ace Your Next <br />
                  Interview with an <br />
                  <span className="text-[#E86D36]">AI Recruiter.</span>
                </h1>

                <p className="text-base sm:text-lg text-[#2C211A]/80 max-w-xl leading-relaxed">
                  Practice real interviews using your voice. Receive AI-powered feedback, detailed analytics, and recruiter-ready reports in minutes.
                </p>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="flex flex-wrap gap-4"
              >
                <Button
                  size="lg"
                  className="bg-[#E86D36] text-white hover:bg-[#E86D36]/95 hover:scale-[1.02] active:scale-[0.98] transition-all px-8 py-6 rounded-full font-medium text-base shadow-lg shadow-[#E86D36]/10"
                  onClick={() => navigate(user ? "/dashboard" : "/signup")}
                >
                  Start Free Interview
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white border-[#ECE5DE] text-[#2C211A] hover:bg-[#FAF7F2] px-8 py-6 rounded-full font-medium text-base shadow-sm"
                  onClick={() => {
                    const el = document.getElementById("live-demo");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Watch Demo
                </Button>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="pt-6 border-t border-[#ECE5DE]/80"
              >
                <div className="flex items-center gap-1 mb-3 text-sm text-[#2C211A]/70">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#E86D36] text-[#E86D36]" />
                  ))}
                  <span className="ml-2 font-medium">Trusted by candidates preparing for:</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 opacity-50 select-none">
                  <span className="font-semibold tracking-tight text-lg font-serif">Google</span>
                  <span className="font-semibold tracking-tight text-lg font-serif">Microsoft</span>
                  <span className="font-semibold tracking-tight text-lg font-serif">Amazon</span>
                  <span className="font-semibold tracking-tight text-lg font-serif">Adobe</span>
                  <span className="font-semibold tracking-tight text-lg font-serif">TCS</span>
                  <span className="font-semibold tracking-tight text-lg font-serif">Infosys</span>
                </div>
              </motion.div>
            </div>

            {/* Right Side: Animated Floating Dashboard */}
            <div className="lg:col-span-6 flex justify-center">
              <TiltCard className="w-full max-w-[500px]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="glassmorphism rounded-3xl p-6 md:p-8 shadow-2xl relative border border-white/60"
                >
                  {/* Dashboard top header */}
                  <div className="flex items-center justify-between pb-6 border-b border-[#ECE5DE]/60 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#E86D36] animate-pulse" />
                      <span className="text-xs uppercase tracking-widest font-semibold text-[#2C211A]/60">AI Interview In Progress</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-full text-xs font-semibold text-[#2C211A]/80 border border-[#ECE5DE]/50">
                      <Mic className="w-3 h-3 text-[#E86D36] animate-bounce" />
                      <span>Live Audio</span>
                    </div>
                  </div>

                  {/* Question Card */}
                  <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#ECE5DE]/50 mb-6">
                    <div className="text-xs text-[#E86D36] font-semibold mb-1">QUESTION 2 OF 5</div>
                    <div className="font-serif text-base font-semibold text-[#2C211A] leading-relaxed">
                      "Why is immutability important in functional programming, and how do you achieve it in React?"
                    </div>
                  </div>

                  {/* Audio Waveform */}
                  <div className="h-16 flex items-center justify-center gap-1.5 mb-6 bg-white/40 rounded-xl px-4 border border-[#ECE5DE]/30">
                    {[3, 6, 8, 4, 12, 18, 14, 8, 22, 16, 9, 14, 26, 12, 6, 10, 4, 2].map((height, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 rounded-full bg-[#2C211A]"
                        animate={{ height: [height, height * 1.5, height * 0.7, height] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.05 }}
                      />
                    ))}
                  </div>

                  {/* Live Transcript */}
                  <div className="bg-[#2C211A] text-[#FAF7F2] rounded-2xl p-4 mb-6 shadow-lg">
                    <div className="text-[10px] text-white/50 tracking-wider uppercase mb-1">Live Transcript</div>
                    <p className="text-xs leading-relaxed text-white/90">
                      "Immutability guarantees that state doesn't mutate unexpectedly. In React, we use functional updates or state hooks to produce new objects, which triggers clean shallow comparisons and renders..."
                    </p>
                  </div>

                  {/* Evaluation Indicators */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-[#2C211A]/80">Communication Speed</span>
                      <span className="font-numbers font-semibold">145 WPM (Optimal)</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#FAF7F2] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#E86D36]"
                        initial={{ width: "0%" }}
                        animate={{ width: "90%" }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                      />
                    </div>

                    {/* Scores row */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="bg-white/80 border border-[#ECE5DE]/60 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-[#2C211A]/50 font-semibold mb-1">TECHNICAL</div>
                        <div className="font-numbers text-lg font-bold text-[#2C211A]">88/100</div>
                      </div>
                      <div className="bg-white/80 border border-[#ECE5DE]/60 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-[#2C211A]/50 font-semibold mb-1">CONFIDENCE</div>
                        <div className="font-numbers text-lg font-bold text-[#E86D36]">94%</div>
                      </div>
                      <div className="bg-white/80 border border-[#ECE5DE]/60 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-[#2C211A]/50 font-semibold mb-1">OVERALL</div>
                        <div className="font-numbers text-lg font-bold text-[#2C211A]">91/100</div>
                      </div>
                    </div>

                    {/* AI Suggestions snippet */}
                    <div className="bg-[#E86D36]/5 rounded-xl p-3 border border-[#E86D36]/10 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#E86D36] shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-semibold text-[#E86D36]">AI Coaching:</span> Mentioning Javascript's structuredClone or Object.freeze would elevate this answer.
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TiltCard>
            </div>

          </div>
        </div>
      </section>

      {/* 3. TRUST SECTION */}
      <section className="py-12 border-y border-[#ECE5DE]/80 bg-white/40">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            
            <div className="text-center space-y-1">
              <AnimatedCounter value={15000} suffix="+" />
              <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-[#2C211A]/60">Interview Sessions</p>
            </div>

            <div className="text-center space-y-1">
              <AnimatedCounter value={8500} suffix="+" />
              <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-[#2C211A]/60">Students Placed</p>
            </div>

            <div className="text-center space-y-1">
              <AnimatedCounter value={96} suffix="%" />
              <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-[#2C211A]/60">Success Rate</p>
            </div>

            <div className="text-center space-y-1">
              <AnimatedCounter value={4.9} suffix="★" duration={1.5} />
              <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-[#2C211A]/60">Average Rating</p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. COMPANY LOGOS MARQUEE */}
      <section className="py-10 bg-[#FAF7F2] overflow-hidden border-b border-[#ECE5DE]/40">
        <div className="relative w-full flex overflow-x-hidden">
          <div className="animate-marquee flex items-center gap-16 text-lg font-serif font-medium text-[#2C211A]/40 whitespace-nowrap">
            <span>Google</span>
            <span>Amazon</span>
            <span>Microsoft</span>
            <span>Adobe</span>
            <span>Oracle</span>
            <span>IBM</span>
            <span>Meta</span>
            <span>Flipkart</span>
            <span>Infosys</span>
            <span>TCS</span>
            {/* Duplicate for seamless infinite marquee loop */}
            <span>Google</span>
            <span>Amazon</span>
            <span>Microsoft</span>
            <span>Adobe</span>
            <span>Oracle</span>
            <span>IBM</span>
            <span>Meta</span>
            <span>Flipkart</span>
            <span>Infosys</span>
            <span>TCS</span>
          </div>
        </div>
      </section>

      {/* 5. FEATURES SECTION */}
      <section id="features" className="py-24 md:py-32 bg-white">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E86D36]/10 text-xs font-bold text-[#E86D36] uppercase tracking-wider">
              System Capabilities
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight">
              Crafted with Elite Recruiter AI
            </h2>
            <p className="text-sm sm:text-base text-[#2C211A]/70 leading-relaxed">
              Every detail is engineered to mimic top-tier corporate interview pipelines, offering unmatched depth and analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {[
              { icon: <Mic className="w-5 h-5 text-[#E86D36]" />, title: "Voice Interview", desc: "Speak directly through your browser, simulating real call screen scenarios." },
              { icon: <Cpu className="w-5 h-5 text-[#E86D36]" />, title: "AI Recruiter", desc: "Interact with context-aware recruiter personas tailored to your industry." },
              { icon: <TrendingUp className="w-5 h-5 text-[#E86D36]" />, title: "Performance Analytics", desc: "Receive deep score breakdown regarding speed, technical alignment, and delivery." },
              { icon: <FileText className="w-5 h-5 text-[#E86D36]" />, title: "PDF Reports", desc: "Download professional PDF resumes evaluation reports ready to show hiring managers." },
              { icon: <Video className="w-5 h-5 text-[#E86D36]" />, title: "Webcam Support", desc: "Get structural confidence and pacing feedback on video response feeds." },
              { icon: <Brain className="w-5 h-5 text-[#E86D36]" />, title: "Resume Questions", desc: "Customized technical interviews built entirely from your history." },
              { icon: <Sparkles className="w-5 h-5 text-[#E86D36]" />, title: "Instant Feedback", desc: "Detailed pointers on code improvements and communication flows in seconds." },
              { icon: <UserCheck className="w-5 h-5 text-[#E86D36]" />, title: "Progress Tracking", desc: "Save full speech logs and charts of progress indicators over time." },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(44,33,26,0.06)" }}
                className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#ECE5DE] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-[#ECE5DE]/60 mb-5">
                  {feature.icon}
                </div>
                <h3 className="font-serif text-lg font-bold text-[#2C211A] mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-[#2C211A]/70 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}

          </div>
        </div>
      </section>

      {/* 6. LIVE INTERVIEW DEMO */}
      <section id="live-demo" className="py-24 md:py-32 bg-[#FAF7F2] border-t border-[#ECE5DE]">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Column: Interactive controls */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#ECE5DE] text-xs font-bold text-[#E86D36] uppercase tracking-wider shadow-sm">
                Interactive Playground
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#2C211A]">
                Try the spoken feedback system.
              </h2>
              <p className="text-sm sm:text-base text-[#2C211A]/70 leading-relaxed">
                Click play below to watch a candidate deliver a response. See how HireLens listens, transcribes, and scores the reply live.
              </p>

              <div className="pt-4">
                <Button
                  onClick={toggleDemo}
                  className="bg-[#2C211A] text-white hover:bg-[#2C211A]/90 hover:scale-[1.02] active:scale-[0.98] transition-all px-8 py-6 rounded-full font-medium"
                >
                  <Play className={`mr-2 w-5 h-5 ${demoState === "playing" ? "animate-ping text-[#E86D36]" : ""}`} />
                  {demoState === "playing" ? "Running Analysis..." : demoState === "done" ? "Restart Demo Play" : "Play Sample Response"}
                </Button>
              </div>

              {demoState === "playing" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 text-xs font-medium text-[#2C211A]/80 bg-white/70 border border-[#ECE5DE] p-3.5 rounded-xl"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E86D36] animate-pulse" />
                  <span>Processing natural language audio stream... {Math.round(demoProgress)}%</span>
                </motion.div>
              )}
            </div>

            {/* Right Column: Visual Dashboard Mock */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-[#ECE5DE]/80">
                {/* Simulated Interview Panel */}
                <div className="border-b border-[#ECE5DE]/60 pb-5 mb-5 flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#2C211A]">Question: Docker Containers</h3>
                    <p className="text-xs text-[#2C211A]/50">Software Architecture Interview</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-[#E86D36]/10 text-[#E86D36]">
                    Active Screen
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Prompt bubble */}
                  <div className="bg-[#FAF7F2] border border-[#ECE5DE]/40 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-[#E86D36] mb-1">INTERVIEWER (AI RECRUITER)</p>
                    <p className="text-sm text-[#2C211A] leading-relaxed">
                      "Could you explain what a Docker Container is and how it differs from a traditional Virtual Machine?"
                    </p>
                  </div>

                  {/* Response wave & text */}
                  <div className="bg-[#2C211A] text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
                    <p className="text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Candidate response feed</p>
                    
                    {/* Dynamic Transcript Reveal */}
                    <p className="text-xs sm:text-sm leading-relaxed text-white/95 min-h-[50px] transition-all duration-300">
                      {demoState === "idle" && <span className="text-white/40 italic">Click Play Sample Response on the left to begin...</span>}
                      {demoState === "playing" && (
                        <span>
                          "A Docker container encapsulates an application and its dependencies together in a single lightweight image...
                          {demoProgress > 40 && " Unlike VMs, containers share the host operating system's kernel, making them spin up in milliseconds..."}
                          {demoProgress > 75 && " This removes hypervisor overhead, ensuring consistency across environments."}
                        </span>
                      )}
                      {demoState === "done" && (
                        <span>
                          "A Docker container encapsulates an application and its dependencies together in a single lightweight image. Unlike VMs, containers share the host operating system's kernel, making them spin up in milliseconds. This removes hypervisor overhead, ensuring consistency across environments."
                        </span>
                      )}
                    </p>

                    {/* Simple Wave visualization */}
                    {demoState === "playing" && (
                      <div className="mt-4 flex items-center gap-1 bg-white/10 rounded-lg p-2.5">
                        <Volume2 className="w-3.5 h-3.5 text-[#E86D36]" />
                        <div className="flex gap-1 items-center flex-1 h-4">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 bg-[#E86D36] rounded-full flex-1"
                              style={{
                                height: `${Math.max(20, Math.sin((demoProgress + i) * 0.5) * 100)}%`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic scores reveal */}
                  <AnimatePresence>
                    {(demoState === "playing" || demoState === "done") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-[#ECE5DE]/60"
                      >
                        <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#ECE5DE]/40">
                          <div className="text-[10px] text-[#2C211A]/50 font-semibold mb-0.5">TECHNICAL</div>
                          <div className="font-numbers text-lg font-bold text-[#2C211A]">
                            {demoProgress > 50 ? "89%" : "Evaluating..."}
                          </div>
                        </div>

                        <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#ECE5DE]/40">
                          <div className="text-[10px] text-[#2C211A]/50 font-semibold mb-0.5">CONFIDENCE</div>
                          <div className="font-numbers text-lg font-bold text-[#2C211A]">
                            {demoProgress > 70 ? "92%" : "Evaluating..."}
                          </div>
                        </div>

                        <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#ECE5DE]/40">
                          <div className="text-[10px] text-[#2C211A]/50 font-semibold mb-0.5">GRAMMAR</div>
                          <div className="font-numbers text-lg font-bold text-[#E86D36]">
                            {demoProgress > 80 ? "96%" : "Evaluating..."}
                          </div>
                        </div>

                        <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#ECE5DE]/40">
                          <div className="text-[10px] text-[#2C211A]/50 font-semibold mb-0.5">OVERALL</div>
                          <div className="font-numbers text-lg font-bold text-[#2C211A]">
                            {demoState === "done" ? "92/100" : "Thinking..."}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS */}
      <section id="how-it-works" ref={timelineRef} className="py-24 md:py-32 bg-white relative">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-24 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E86D36]/10 text-xs font-bold text-[#E86D36] uppercase tracking-wider">
              Step-by-Step Pipeline
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#2C211A]">
              Simple, Powerful, Automated.
            </h2>
            <p className="text-sm sm:text-base text-[#2C211A]/70 leading-relaxed">
              Upload, speak, and get analyzed. Here is how your mock journey unfolds.
            </p>
          </div>

          {/* Timeline steps */}
          <div className="relative max-w-3xl mx-auto">
            {/* Vertical connector line */}
            <div className="absolute left-[20px] top-6 bottom-6 w-0.5 bg-[#ECE5DE]">
              <motion.div
                className="absolute top-0 left-0 right-0 bg-[#E86D36] origin-top"
                style={{ scaleY: pathLength, height: "100%" }}
              />
            </div>

            {[
              { step: "01", title: "Upload Resume", text: "Submit your resume in PDF format. Our system maps out your technology stack and experience depth automatically." },
              { step: "02", title: "Choose Role", text: "Select your desired target position (e.g. Frontend Engineer, Product Manager, Data Scientist) to align questions." },
              { step: "03", title: "AI Generates Questions", text: "HireLens compiles matching behavioral patterns and customized technology prompts based on your profile." },
              { step: "04", title: "Speak Naturally", text: "Turn on your mic and answer exactly like a live screen call, without any stress or high stakes." },
              { step: "05", title: "AI Evaluates", text: "Advanced LLMs and speed tracking metrics score code depth, clarity, pacing, and vocabulary choices." },
              { step: "06", title: "Download Report", text: "Save feedback sheets outlining corrections, overall scores, and specific tips to impress managers." }
            ].map((item, idx) => (
              <div key={idx} className="relative flex gap-8 mb-16 last:mb-0">
                {/* Step indicator node */}
                <div className="relative z-10 w-10 h-10 rounded-full bg-white border-2 border-[#ECE5DE] text-[#2C211A] flex items-center justify-center font-numbers font-bold text-sm shrink-0 transition-colors duration-300 hover:border-[#E86D36]">
                  {item.step}
                </div>

                <div className="space-y-2 pt-1.5">
                  <h3 className="font-serif text-xl font-bold text-[#2C211A]">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-[#2C211A]/70 leading-relaxed max-w-xl">{item.text}</p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* 8. DASHBOARD PREVIEW */}
      <section className="py-24 md:py-32 bg-[#FAF7F2] border-y border-[#ECE5DE]">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#ECE5DE] text-xs font-bold text-[#E86D36] uppercase tracking-wider shadow-sm">
              Analytics Dashboard
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#2C211A]">
              Unlock Premium Progress Insights.
            </h2>
            <p className="text-sm sm:text-base text-[#2C211A]/70 leading-relaxed">
              Track scores, weak areas, and general trend reports inside a sleek candidate dashboard.
            </p>
          </div>

          {/* Interactive Recharts Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Chart Column 1: Radar Chart for Topic breakdown */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#ECE5DE] flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2C211A] mb-1">Skill Alignment</h3>
                <p className="text-xs text-[#2C211A]/60 mb-6">Subject scorecard assessment</p>
              </div>
              <div className="h-[260px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" radius="80%" data={skillData}>
                    <PolarGrid stroke="#ECE5DE" />
                    <PolarAngleAxis dataKey="subject" stroke="#2C211A" fontSize={10} />
                    <PolarRadiusAxis stroke="#ECE5DE" angle={30} domain={[0, 100]} />
                    <Radar name="Candidate score" dataKey="A" stroke="#E86D36" fill="#E86D36" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart Column 2: Area Chart for Improvement Trend */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#ECE5DE] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#2C211A] mb-1">Score Progress Trend</h3>
                  <p className="text-xs text-[#2C211A]/60">Historical performance scaling</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+24% Growth</span>
                </div>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E86D36" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#E86D36" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="session" stroke="#2C211A" opacity={0.6} fontSize={11} />
                    <YAxis stroke="#2C211A" opacity={0.6} fontSize={11} domain={[50, 100]} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="score" stroke="#E86D36" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Topic Cards Column */}
            <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-[#ECE5DE] space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#2C211A]">Areas of Focus</h3>
              
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs sm:text-sm font-semibold text-red-900">Weak: System Architectures</span>
                  </div>
                  <span className="text-xs text-red-700 bg-red-100/50 px-2 py-0.5 rounded font-medium">Needs Practice</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs sm:text-sm font-semibold text-emerald-900">Strong: Javascript Closures</span>
                  </div>
                  <span className="text-xs text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded font-medium">Excellent</span>
                </div>
              </div>
            </div>

            {/* Overall summary stats */}
            <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-[#ECE5DE] flex flex-col justify-between">
              <h3 className="font-serif text-lg font-bold text-[#2C211A] mb-3">Overall Recommendation</h3>
              <p className="text-xs sm:text-sm text-[#2C211A]/80 leading-relaxed mb-4">
                "Candidate communicates with high structure but gets hesitant during runtime analysis questions. Focus on time management during technical explanations."
              </p>
              <div className="pt-3 border-t border-[#ECE5DE]/60 flex items-center justify-between">
                <div className="text-xs font-semibold text-[#2C211A]/60">READY FOR LIVE CALLS:</div>
                <div className="font-numbers font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs">
                  YES (87% Recommendation)
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. WHY HIRELENS COMPARISON TABLE */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E86D36]/10 text-xs font-bold text-[#E86D36] uppercase tracking-wider">
              Comparison Study
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#2C211A]">
              Traditional vs HireLens Practice
            </h2>
            <p className="text-sm sm:text-base text-[#2C211A]/70 leading-relaxed">
              Why top software engineers and candidate builders choose our platform over static study sheets.
            </p>
          </div>

          <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl border border-[#ECE5DE] shadow-sm">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#ECE5DE]">
                  <th className="p-4 sm:p-6 text-sm font-semibold text-[#2C211A]/50">PRACTICE METHOD</th>
                  <th className="p-4 sm:p-6 text-sm font-semibold text-[#2C211A]/70">TRADITIONAL PRACTICE</th>
                  <th className="p-4 sm:p-6 text-sm font-bold text-[#E86D36] bg-[#E86D36]/5">HIRELENS AI METHOD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE5DE] text-xs sm:text-sm">
                
                <tr>
                  <td className="p-4 sm:p-6 font-semibold">Spoken Evaluation</td>
                  <td className="p-4 sm:p-6 text-red-600 flex items-center gap-2">
                    <X className="w-4 h-4" /> No Feedback
                  </td>
                  <td className="p-4 sm:p-6 text-emerald-600 font-bold bg-[#E86D36]/5">
                    <Check className="w-4 h-4 inline mr-1" /> Live Speech Scoring
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-6 font-semibold">Custom Questions</td>
                  <td className="p-4 sm:p-6 text-red-600 flex items-center gap-2">
                    <X className="w-4 h-4" /> Manual Setup (Not tailored)
                  </td>
                  <td className="p-4 sm:p-6 text-emerald-600 font-bold bg-[#E86D36]/5">
                    <Check className="w-4 h-4 inline mr-1" /> Resume-Based Questions
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-6 font-semibold">Pacing & Structure Analytics</td>
                  <td className="p-4 sm:p-6 text-red-600 flex items-center gap-2">
                    <X className="w-4 h-4" /> No Analytics
                  </td>
                  <td className="p-4 sm:p-6 text-emerald-600 font-bold bg-[#E86D36]/5">
                    <Check className="w-4 h-4 inline mr-1" /> Speed/WPM Tracking
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-6 font-semibold">Grammar & Vocal Check</td>
                  <td className="p-4 sm:p-6 text-red-600 flex items-center gap-2">
                    <X className="w-4 h-4" /> No AI Assessment
                  </td>
                  <td className="p-4 sm:p-6 text-emerald-600 font-bold bg-[#E86D36]/5">
                    <Check className="w-4 h-4 inline mr-1" /> Detailed Grammar Corrections
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 10. TESTIMONIALS CAROUSEL */}
      <section className="py-24 bg-[#FAF7F2] border-t border-[#ECE5DE]">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#ECE5DE] text-xs font-bold text-[#E86D36] uppercase tracking-wider shadow-sm">
              Candidate Reviews
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#2C211A]">
              Recommended by Top Engineers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-[#ECE5DE] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#E86D36] text-[#E86D36]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#2C211A]/80 italic leading-relaxed mb-6">
                    "{t.text}"
                  </p>
                </div>

                <div className="flex items-center gap-3 border-t border-[#ECE5DE]/60 pt-4">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-[#ECE5DE]" />
                  <div>
                    <h4 className="font-semibold text-xs sm:text-sm text-[#2C211A]">{t.name}</h4>
                    <p className="text-[10px] sm:text-xs text-[#2C211A]/55 font-medium">{t.role} &middot; <span className="text-[#E86D36]">{t.company}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FAQ ACCORDION */}
      <section id="faq" className="py-24 md:py-32 bg-white border-t border-[#ECE5DE]">
        <div className="container max-w-3xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#2C211A]">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#2C211A]/65">
              Everything you need to know about our recruitment training and spoken scoring systems.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="border border-[#ECE5DE] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold hover:bg-[#FAF7F2]/60 transition-colors"
                  >
                    <span className="font-serif text-base text-[#2C211A]">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-5 pt-0 text-xs sm:text-sm text-[#2C211A]/70 leading-relaxed border-t border-[#ECE5DE]/30">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 12. FINAL CTA */}
      <section className="py-24 md:py-32 bg-[#FAF7F2] border-t border-[#ECE5DE] text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E86D36]/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="container max-w-4xl mx-auto px-6 relative z-10 space-y-8">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#2C211A]">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-sm sm:text-base text-[#2C211A]/80 max-w-xl mx-auto leading-relaxed">
            Create an account, upload your resume, and speak aloud to build the communication habits that secure offers.
          </p>

          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              className="bg-[#E86D36] text-white hover:bg-[#E86D36]/90 hover:scale-[1.02] active:scale-[0.98] transition-all px-8 py-6 rounded-full font-medium shadow-md"
              onClick={() => navigate("/signup")}
            >
              Start Your AI Interview Today
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

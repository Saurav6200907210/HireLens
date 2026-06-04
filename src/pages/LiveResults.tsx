import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Play } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from "recharts";

type Improved = { question: string; original: string; improved: string };

const LiveResults = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const trendRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && !user) nav("/login"); }, [user, loading, nav]);

  useEffect(() => {
    if (!id || !user) return;
    supabase.from("live_interviews").select("*").eq("id", id).maybeSingle().then(async ({ data }) => {
      setData(data);
      if (data?.recording_url) {
        const { data: signed } = await supabase.storage.from("interview-recordings").createSignedUrl(data.recording_url, 3600);
        if (signed?.signedUrl) setRecordingUrl(signed.signedUrl);
      }
    });
    supabase.from("live_interviews").select("id,total_score,created_at,role")
      .eq("user_id", user.id).eq("status", "completed").order("created_at", { ascending: true })
      .then(({ data }) => setHistory(data ?? []));
  }, [id, user]);

  if (!data) return <div className="min-h-screen bg-background"><SiteHeader /></div>;

  const dims = [
    { name: "Technical", value: data.technical_score ?? 0 },
    { name: "Communication", value: data.communication_score ?? 0 },
    { name: "Confidence", value: data.confidence_score ?? 0 },
    { name: "Grammar", value: data.grammar_score ?? 0 },
    { name: "Clarity", value: data.clarity_score ?? 0 },
  ];

  const pieData = [
    { name: "Score", value: data.total_score ?? 0 },
    { name: "Gap", value: 100 - (data.total_score ?? 0) },
  ];
  const PIE_COLORS = ["hsl(var(--accent))", "hsl(var(--muted))"];

  const trend = history.map((h, i) => ({ n: i + 1, score: h.total_score, current: h.id === id }));

  const transcript = (data.transcript as Array<{ role: string; text: string }>) ?? [];
  const improved = (data.improved_answers as Improved[]) ?? [];

  const downloadPDF = async () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 18;

    const addPageIfNeeded = (need: number) => {
      if (y + need > pageH - 15) { doc.addPage(); y = 18; }
    };
    const section = (title: string) => {
      addPageIfNeeded(12);
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(20);
      doc.text(title, 14, y); y += 2;
      doc.setDrawColor(220); doc.line(14, y, pageW - 14, y); y += 6;
      doc.setFont("helvetica", "normal");
    };
    const bullets = (items: string[]) => {
      doc.setFontSize(10); doc.setTextColor(50);
      (items ?? []).forEach((s) => {
        const lines = doc.splitTextToSize(`•  ${s}`, pageW - 28);
        addPageIfNeeded(lines.length * 5 + 2);
        lines.forEach((l: string) => { doc.text(l, 16, y); y += 5; });
        y += 1;
      });
      y += 2;
    };

    // Header band
    doc.setFillColor(245, 240, 232); doc.rect(0, 0, pageW, 32, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(30);
    doc.text(`${data.role}`, 14, 16);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(110);
    doc.text(`Live AI Interview Scorecard`, 14, 22);
    doc.text(`${data.difficulty}  ·  ${new Date(data.created_at).toLocaleString()}  ·  ${data.duration_seconds ? Math.round(data.duration_seconds/60)+" min" : "—"}`, 14, 28);
    y = 42;

    // Big score
    doc.setFont("helvetica", "bold"); doc.setFontSize(46); doc.setTextColor(30);
    doc.text(`${data.total_score ?? 0}`, 14, y + 8);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`/ 100 overall`, 36, y + 8);
    y += 16;

    // Render charts (breakdown + overall pie) as image
    if (chartsRef.current) {
      try {
        const canvas = await html2canvas(chartsRef.current, { scale: 2, backgroundColor: "#ffffff", logging: false });
        const img = canvas.toDataURL("image/png");
        const w = pageW - 28;
        const h = (canvas.height * w) / canvas.width;
        addPageIfNeeded(h + 6);
        doc.addImage(img, "PNG", 14, y, w, h, undefined, "FAST");
        y += h + 6;
      } catch (e) { console.warn("chart capture failed", e); }
    }

    // Dim breakdown text
    section("Score breakdown");
    doc.setFontSize(10); doc.setTextColor(50);
    dims.forEach((d) => {
      addPageIfNeeded(8);
      doc.text(d.name, 16, y);
      // bar
      const barX = 60, barW = pageW - 60 - 28, barH = 4;
      doc.setFillColor(235, 235, 235); doc.rect(barX, y - 3, barW, barH, "F");
      doc.setFillColor(220, 110, 60); doc.rect(barX, y - 3, (barW * (d.value || 0)) / 100, barH, "F");
      doc.text(String(d.value) + "/100", pageW - 14, y, { align: "right" });
      y += 8;
    });
    y += 2;

    if (data.summary) {
      section("Summary");
      doc.setFontSize(11); doc.setTextColor(40);
      const lines = doc.splitTextToSize(data.summary, pageW - 28);
      addPageIfNeeded(lines.length * 5 + 4);
      lines.forEach((l: string) => { doc.text(l, 14, y); y += 5; });
      y += 4;
    }

    section("Strengths"); bullets(data.strengths ?? []);
    section("To improve"); bullets(data.weaknesses ?? []);
    section("Suggestions"); bullets(data.suggestions ?? []);

    // Trajectory chart
    if (trend.length > 1 && trendRef.current) {
      try {
        const canvas = await html2canvas(trendRef.current, { scale: 2, backgroundColor: "#ffffff", logging: false });
        const img = canvas.toDataURL("image/png");
        const w = pageW - 28;
        const h = (canvas.height * w) / canvas.width;
        section("Your trajectory");
        addPageIfNeeded(h + 4);
        doc.addImage(img, "PNG", 14, y, w, h, undefined, "FAST");
        y += h + 6;
      } catch (e) { console.warn("trend capture failed", e); }
    }

    // Improved answers
    if (improved.length) {
      section("Improved answers");
      improved.forEach((p, idx) => {
        addPageIfNeeded(28);
        doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(30);
        const q = doc.splitTextToSize(`Q${idx + 1}. ${p.question}`, pageW - 28);
        q.forEach((l: string) => { addPageIfNeeded(6); doc.text(l, 14, y); y += 5; });
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120);
        doc.text("Your answer", 14, y); y += 4;
        doc.setFontSize(10); doc.setTextColor(60);
        doc.splitTextToSize(p.original || "—", pageW - 28).forEach((l: string) => { addPageIfNeeded(5); doc.text(l, 14, y); y += 5; });
        y += 1;
        doc.setFontSize(9); doc.setTextColor(220, 110, 60);
        doc.text("Improved", 14, y); y += 4;
        doc.setFontSize(10); doc.setTextColor(40);
        doc.splitTextToSize(p.improved || "—", pageW - 28).forEach((l: string) => { addPageIfNeeded(5); doc.text(l, 14, y); y += 5; });
        y += 4;
      });
    }

    // Transcript
    section("Full transcript");
    transcript.forEach((t) => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(120);
      addPageIfNeeded(10);
      doc.text(t.role === "interviewer" ? "Aria" : "You", 14, y); y += 4;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
      doc.splitTextToSize(t.text, pageW - 28).forEach((l: string) => { addPageIfNeeded(5); doc.text(l, 14, y); y += 5; });
      y += 2;
    });

    // Footer page numbers
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(160);
      doc.text(`${data.role} · Interview Buddy`, 14, pageH - 8);
      doc.text(`${i} / ${pages}`, pageW - 14, pageH - 8, { align: "right" });
    }

    doc.save(`interview-${data.role.replace(/\s+/g,"-")}-${data.id.slice(0,6)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-12 max-w-5xl" ref={reportRef}>
        <div className="flex items-start justify-between mb-10 gap-6 flex-wrap">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">№ 04 — Scorecard</p>
            <h1 className="font-serif text-5xl mb-2">{data.role}</h1>
            <p className="text-muted-foreground">{data.difficulty} · {new Date(data.created_at).toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"})} · {data.duration_seconds ? Math.round(data.duration_seconds/60)+" min" : "—"}</p>
          </div>
          <div className="flex gap-2">
            {recordingUrl && <Button variant="outline" onClick={() => setShowReplay(s => !s)}><Play className="w-4 h-4 mr-2" />{showReplay ? "Hide" : "Replay"}</Button>}
            <Button onClick={downloadPDF}><Download className="w-4 h-4 mr-2" />Download PDF</Button>
          </div>
        </div>

        {showReplay && recordingUrl && (
          <Card className="p-4 mb-10">
            <video src={recordingUrl} controls className="w-full rounded" />
          </Card>
        )}

        <div ref={chartsRef} className="grid md:grid-cols-3 gap-6 mb-10 bg-background">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 h-full">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Overall</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={75} startAngle={90} endAngle={-270}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <p className="font-serif text-5xl text-center -mt-[120px] mb-[80px]">{data.total_score}</p>
            </Card>
          </motion.div>
          <Card className="p-8 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Breakdown</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dims}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {data.summary && (
          <Card className="p-10 mb-10">
            <p className="text-lg leading-relaxed font-serif italic">"{data.summary}"</p>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {[
            { title: "Strengths", items: data.strengths ?? [] },
            { title: "To improve", items: data.weaknesses ?? [] },
            { title: "Suggestions", items: data.suggestions ?? [] },
          ].map((s, i) => (
            <Card key={i} className="p-8">
              <h3 className="font-serif text-xl mb-4">{s.title}</h3>
              <ul className="space-y-2 text-sm">
                {s.items.map((x: string, j: number) => (
                  <li key={j} className="flex gap-3"><span className="text-accent">→</span><span>{x}</span></li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {trend.length > 1 && (
          <Card ref={trendRef} className="p-8 mb-10">
            <h3 className="font-serif text-2xl mb-4">Your trajectory</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="n" stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {improved.length > 0 && (
          <>
            <h2 className="font-serif text-3xl mb-6">Improved answers</h2>
            <div className="space-y-6 mb-10">
              {improved.map((p, i) => (
                <Card key={i} className="p-8">
                  <p className="font-serif text-lg mb-4">Q. {p.question}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your answer</p>
                  <p className="text-sm mb-4 leading-relaxed">{p.original}</p>
                  <p className="text-xs uppercase tracking-wider text-accent mb-1">Improved</p>
                  <p className="text-sm leading-relaxed font-serif italic">{p.improved}</p>
                </Card>
              ))}
            </div>
          </>
        )}

        <h2 className="font-serif text-3xl mb-6">Full transcript</h2>
        <Card className="p-8 mb-10 space-y-4 max-h-[500px] overflow-y-auto">
          {transcript.map((t, i) => (
            <div key={i} className={t.role === "interviewer" ? "" : "pl-6 border-l-2 border-accent"}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t.role === "interviewer" ? "Aria" : "You"}</p>
              <p className="text-sm leading-relaxed">{t.text}</p>
            </div>
          ))}
        </Card>

        <div className="flex gap-3">
          <Button asChild size="lg"><Link to="/dashboard">Back to studio</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/live-setup">New session</Link></Button>
        </div>
      </main>
    </div>
  );
};

export default LiveResults;

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

const Results = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && !user) nav("/login"); }, [user, loading, nav]);

  useEffect(() => {
    if (!id) return;
    supabase.from("interviews").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => setData(data));
  }, [id]);

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 18;

    const addPageIfNeeded = (need: number) => {
      if (y + need > pageH - 15) { doc.addPage(); y = 18; }
    };
    const section = (title: string) => {
      addPageIfNeeded(14);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(20);
      doc.text(title, 14, y); y += 2;
      doc.setDrawColor(220); doc.line(14, y, pageW - 14, y); y += 7;
      doc.setFont("helvetica", "normal");
    };
    const bullets = (items: string[], color?: [number, number, number]) => {
      doc.setFontSize(10); doc.setTextColor(...(color ?? [50, 50, 50] as [number,number,number]));
      (items ?? []).forEach((s) => {
        const lines = doc.splitTextToSize(`•  ${s}`, pageW - 28);
        addPageIfNeeded(lines.length * 5 + 2);
        lines.forEach((l: string) => { doc.text(l, 16, y); y += 5; });
        y += 1;
      });
      y += 2;
    };

    // ── Header band ──
    doc.setFillColor(245, 240, 232); doc.rect(0, 0, pageW, 32, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(30);
    doc.text(`${data.role} Engineer`, 14, 14);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(110);
    doc.text(`MCQ Interview Report`, 14, 21);
    doc.text(`${data.difficulty}  ·  ${new Date(data.created_at).toLocaleString()}`, 14, 27);
    y = 40;

    // ── Big total score ──
    doc.setFont("helvetica", "bold"); doc.setFontSize(48); doc.setTextColor(30);
    doc.text(`${data.total_score ?? 0}`, 14, y + 10);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`/ 100  overall`, 40, y + 10);
    // MCQ correct count
    const perQ: any[] = data.per_question ?? [];
    const mcqQ = perQ.filter((p: any) => p.is_mcq);
    if (mcqQ.length) {
      const correct = mcqQ.filter((p: any) => p.is_correct).length;
      doc.setFontSize(9); doc.setTextColor(150);
      doc.text(`${correct} / ${mcqQ.length} correct answers`, 40, y + 16);
    }
    y += 24;

    // ── Score breakdown bar ──
    section("Score Breakdown");
    const dims = [
      { name: "Overall", value: data.total_score ?? 0 },
      { name: "Technical", value: data.technical_score ?? 0 },
    ];
    doc.setFontSize(10); doc.setTextColor(50);
    dims.forEach((d) => {
      addPageIfNeeded(9);
      doc.text(d.name, 16, y);
      const barX = 55, barW = pageW - 55 - 28, barH = 4;
      doc.setFillColor(235, 235, 235); doc.rect(barX, y - 3, barW, barH, "F");
      doc.setFillColor(220, 110, 60); doc.rect(barX, y - 3, (barW * (d.value || 0)) / 100, barH, "F");
      doc.text(`${d.value}/100`, pageW - 14, y, { align: "right" });
      y += 9;
    });
    y += 3;

    if (data.summary) {
      section("Summary");
      doc.setFontSize(11); doc.setTextColor(40);
      const lines = doc.splitTextToSize(data.summary, pageW - 28);
      addPageIfNeeded(lines.length * 5 + 4);
      lines.forEach((l: string) => { doc.text(l, 14, y); y += 5; });
      y += 4;
    }

    section("Strengths"); bullets(data.strengths ?? [], [40, 130, 70]);
    section("To Improve"); bullets(data.weaknesses ?? [], [180, 60, 60]);

    // ── Question by question ──
    section("Question by Question");
    perQ.forEach((p: any, i: number) => {
      addPageIfNeeded(30);
      // Question header
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(30);
      const qLines = doc.splitTextToSize(`Q${i + 1}. ${p.question}`, pageW - 46);
      // Score badge
      if (p.is_mcq) {
        const badge = p.is_correct ? "✓" : "✗";
        doc.setTextColor(p.is_correct ? 40 : 200, p.is_correct ? 130 : 50, p.is_correct ? 70 : 50);
        doc.text(badge, pageW - 14, y, { align: "right" });
        doc.setTextColor(30);
      } else {
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(100);
        doc.text(`${p.score}/100`, pageW - 14, y, { align: "right" });
        doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(30);
      }
      qLines.forEach((l: string) => { addPageIfNeeded(6); doc.text(l, 14, y); y += 5; });
      // Your answer
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.setTextColor(120); doc.text("Your answer", 14, y); y += 4;
      doc.setFontSize(10);
      const aColor: [number,number,number] = p.is_mcq ? (p.is_correct ? [40,130,70] : [200,60,60]) : [60,60,60];
      doc.setTextColor(...aColor);
      doc.splitTextToSize(p.answer || "—", pageW - 28).forEach((l: string) => { addPageIfNeeded(5); doc.text(l, 14, y); y += 5; });
      // Correct / Ideal answer
      if (p.ideal_answer) {
        doc.setFontSize(9); doc.setTextColor(p.is_mcq ? 40 : 220, p.is_mcq ? 130 : 110, p.is_mcq ? 70 : 60);
        doc.text(p.is_mcq ? "Correct answer" : "Suggested answer", 14, y); y += 4;
        doc.setFontSize(10); doc.setTextColor(40);
        doc.splitTextToSize(p.ideal_answer, pageW - 28).forEach((l: string) => { addPageIfNeeded(5); doc.text(l, 14, y); y += 5; });
      }
      // Feedback
      if (p.feedback) {
        doc.setFontSize(9); doc.setTextColor(120); doc.text("Feedback", 14, y); y += 4;
        doc.setFontSize(10); doc.setTextColor(80);
        doc.splitTextToSize(p.feedback, pageW - 28).forEach((l: string) => { addPageIfNeeded(5); doc.text(l, 14, y); y += 5; });
      }
      y += 4;
      doc.setDrawColor(230); doc.line(14, y, pageW - 14, y); y += 5;
    });

    // ── Footer with page numbers ──
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(160);
      doc.text(`${data.role} MCQ · Interview Buddy · Built by Saurav Kumar`, 14, pageH - 8);
      doc.text(`${i} / ${pages}`, pageW - 14, pageH - 8, { align: "right" });
    }

    doc.save(`mcq-${data.role.replace(/\s+/g, "-")}-${data.id.slice(0, 6)}.pdf`);
  };

  if (!data) return <div className="min-h-screen bg-background"><SiteHeader /></div>;

  const Score = ({ label, value }: { label: string; value: number | null }) => (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{label}</p>
      <p className="font-serif text-6xl">{value ?? "—"}<span className="text-2xl text-muted-foreground">/100</span></p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-16 max-w-4xl" ref={reportRef}>
        <div className="flex items-start justify-between gap-6 flex-wrap mb-3">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">№ 04 — Report</p>
          <Button onClick={downloadPDF} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />Download PDF
          </Button>
        </div>
        <h1 className="font-serif text-5xl mb-2">{data.role} interview</h1>
        <p className="text-muted-foreground mb-12">{data.difficulty} · {new Date(data.created_at).toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"})}</p>

        <Card className="p-10 mb-10">
          <div className="grid md:grid-cols-3 gap-10">
            <Score label="Overall" value={data.total_score} />
            <Score label="Technical" value={data.technical_score} />
            <Score label="Communication" value={data.communication_score} />
          </div>
          {data.summary && (
            <>
              <div className="editorial-rule my-10" />
              <p className="text-lg leading-relaxed font-serif italic">"{data.summary}"</p>
            </>
          )}
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <Card className="p-8">
            <h3 className="font-serif text-2xl mb-4">Strengths</h3>
            <ul className="space-y-2 text-sm">
              {(data.strengths ?? []).map((s: string, i: number) => (
                <li key={i} className="flex gap-3"><span className="text-accent">→</span><span>{s}</span></li>
              ))}
            </ul>
          </Card>
          <Card className="p-8">
            <h3 className="font-serif text-2xl mb-4">To improve</h3>
            <ul className="space-y-2 text-sm">
              {(data.weaknesses ?? []).map((s: string, i: number) => (
                <li key={i} className="flex gap-3"><span className="text-accent">→</span><span>{s}</span></li>
              ))}
            </ul>
          </Card>
        </div>

        <h2 className="font-serif text-3xl mb-6">Question by question</h2>
        <div className="space-y-6 mb-12">
          {(data.per_question ?? []).map((p: any, i: number) => (
            <Card key={i} className={`p-8 border-l-4 ${p.is_mcq ? (p.is_correct ? 'border-l-green-500' : 'border-l-red-500') : 'border-l-accent'}`}>
              <div className="flex items-start justify-between gap-6 mb-4">
                <p className="font-serif text-xl flex-1">{i + 1}. {p.question}</p>
                {p.is_mcq ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-3xl font-bold ${p.is_correct ? 'text-green-500' : 'text-red-500'}`}>
                      {p.is_correct ? '✓' : '✗'}
                    </span>
                    <span className="text-sm text-muted-foreground">{p.score}/1</span>
                  </div>
                ) : (
                  <p className="font-serif text-3xl">{p.score}<span className="text-lg text-muted-foreground">/100</span></p>
                )}
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your answer</p>
              <p className={`text-sm mb-4 leading-relaxed font-medium ${p.is_mcq ? (p.is_correct ? 'text-green-600' : 'text-red-500') : ''}`}>{p.answer}</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Feedback</p>
              <p className="text-sm mb-4 leading-relaxed text-muted-foreground">{p.feedback}</p>
              {p.ideal_answer && (
                <>
                  <p className="text-xs uppercase tracking-wider text-accent mb-1">{p.is_mcq ? 'Correct answer' : 'Suggested answer'}</p>
                  <p className={`text-sm leading-relaxed font-serif ${p.is_mcq ? 'font-semibold text-green-600' : 'italic'}`}>{p.ideal_answer}</p>
                </>
              )}
            </Card>
          ))}
        </div>

        <div className="flex gap-4">
          <Button asChild size="lg"><Link to="/dashboard">Back to studio</Link></Button>
        </div>
      </main>
    </div>
  );
};

export default Results;

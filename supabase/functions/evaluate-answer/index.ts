const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { role, difficulty, question, answer, mode = "single" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (mode === "final") {
      // answer is array of {question, answer, score, feedback}
      const items = answer as Array<{ question: string; answer: string; score: number; feedback: string }>;
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a senior interviewer summarizing a candidate's interview." },
            { role: "user", content: `Role: ${role}, Difficulty: ${difficulty}.\nQ&A with per-question scores:\n${JSON.stringify(items, null, 2)}\n\nProduce a final report.` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "final_report",
              parameters: {
                type: "object",
                properties: {
                  total_score: { type: "integer", minimum: 0, maximum: 100 },
                  technical_score: { type: "integer", minimum: 0, maximum: 100 },
                  communication_score: { type: "integer", minimum: 0, maximum: 100 },
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                  summary: { type: "string" },
                },
                required: ["total_score", "technical_score", "communication_score", "strengths", "weaknesses", "summary"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "final_report" } },
        }),
      });
      if (!resp.ok) {
        if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const data = await resp.json();
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      return new Response(args ?? "{}", { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a strict but fair technical interviewer evaluating a single answer." },
          { role: "user", content: `Role: ${role} (${difficulty}).\nQuestion: ${question}\nCandidate answer (transcribed from speech): ${answer}\n\nEvaluate.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "evaluate",
            parameters: {
              type: "object",
              properties: {
                score: { type: "integer", minimum: 0, maximum: 100 },
                feedback: { type: "string", description: "1-2 sentences of constructive feedback" },
                ideal_answer: { type: "string", description: "A concise improved answer (max 80 words)" },
              },
              required: ["score", "feedback", "ideal_answer"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "evaluate" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return new Response(args ?? "{}", { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

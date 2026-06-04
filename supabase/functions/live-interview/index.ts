// Live AI Interview edge function
// Modes:
//  - "next": given role/difficulty + transcript so far, return the next interviewer question (with optional follow-up logic)
//  - "final": given full transcript, return multi-dimensional evaluation
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type Turn = { role: "interviewer" | "candidate"; text: string };

function aiHeaders() {
  return {
    Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "Content-Type": "application/json",
  };
}

function errResp(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { mode, role, difficulty, transcript = [] as Turn[], questionCount = 8 } = body;

    if (mode === "next") {
      const askedQuestions = (transcript as Turn[])
        .filter((t) => t.role === "interviewer")
        .map((t) => `- ${t.text}`)
        .join("\n");
      const seed = Math.random().toString(36).slice(2, 10);
      const topicPool = [
        "system design", "data structures", "algorithms", "debugging story",
        "team conflict", "ownership", "trade-offs", "performance optimization",
        "testing strategy", "favorite project", "failure & learning", "code review",
        "scalability", "security awareness", "cross-team collaboration", "deadline pressure",
      ];
      const shuffled = topicPool.sort(() => Math.random() - 0.5).slice(0, 6).join(", ");

      const systemPrompt = `You are Aria, a professional, friendly female HR + technical interviewer at a top tech company.
Role being interviewed: ${role}. Difficulty: ${difficulty}.
You will conduct a realistic spoken interview of about ${questionCount} questions.
Session seed (for variety): ${seed}. Suggested topic angles to draw from: ${shuffled}.

Behavior rules:
- ALWAYS ask a NEW, DIFFERENT question. Do NOT repeat or paraphrase any question already asked in the list below.
- Vary HR/behavioral and technical questions; rotate topics. Avoid clichés like "tell me about yourself" if it has already been asked.
- If candidate said "(skipped)" or "(no audible response)": acknowledge briefly ("No problem, let's try another.") and ask a COMPLETELY DIFFERENT question on a new topic — do NOT re-ask the skipped one.
- If their previous answer was vague: ask one sharp follow-up that drills deeper, then move on.
- If their answer was strong: move to a new topic.
- Speak naturally, conversational, 1-3 sentences max per turn.
- Do NOT give feedback during the interview.
- When you've covered enough ground (~${questionCount} questions answered), say a short closing line and set "is_final": true.
- The first turn should warmly greet the candidate and ask them to briefly introduce themselves.

Already-asked questions (DO NOT repeat any of these):
${askedQuestions || "(none yet)"}`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...transcript.map((t: Turn) => ({
          role: t.role === "interviewer" ? "assistant" : "user",
          content: t.text,
        })),
      ];

      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: aiHeaders(),
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          temperature: 1.0,
          messages,
          tools: [{
            type: "function",
            function: {
              name: "interviewer_turn",
              parameters: {
                type: "object",
                properties: {
                  text: { type: "string", description: "What the interviewer says next, conversational, max 3 sentences." },
                  is_final: { type: "boolean", description: "True only when wrapping up the interview." },
                },
                required: ["text", "is_final"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "interviewer_turn" } },
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) return errResp(429, "Rate limit. Try again shortly.");
        if (resp.status === 402) return errResp(402, "AI credits exhausted.");
        return errResp(500, "AI gateway error");
      }
      const data = await resp.json();
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
      return new Response(args, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "final") {
      const systemPrompt = `You are a senior interviewer producing a final scorecard for a ${role} (${difficulty}) candidate after a live spoken interview.
Be honest and specific. Score across 5 dimensions out of 100.`;
      const transcriptText = (transcript as Turn[])
        .map((t) => `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${t.text}`)
        .join("\n");

      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: aiHeaders(),
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Transcript:\n${transcriptText}\n\nProduce the scorecard.` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "scorecard",
              parameters: {
                type: "object",
                properties: {
                  total_score: { type: "integer", minimum: 0, maximum: 100 },
                  technical_score: { type: "integer", minimum: 0, maximum: 100 },
                  communication_score: { type: "integer", minimum: 0, maximum: 100 },
                  confidence_score: { type: "integer", minimum: 0, maximum: 100 },
                  grammar_score: { type: "integer", minimum: 0, maximum: 100 },
                  clarity_score: { type: "integer", minimum: 0, maximum: 100 },
                  strengths: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
                  weaknesses: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
                  suggestions: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
                  improved_answers: {
                    type: "array",
                    description: "For up to 5 of the candidate's weaker answers, give an improved version.",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        original: { type: "string" },
                        improved: { type: "string" },
                      },
                      required: ["question", "original", "improved"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "2-3 sentence overall summary." },
                },
                required: [
                  "total_score","technical_score","communication_score","confidence_score",
                  "grammar_score","clarity_score","strengths","weaknesses","suggestions",
                  "improved_answers","summary"
                ],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "scorecard" } },
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) return errResp(429, "Rate limit.");
        if (resp.status === 402) return errResp(402, "AI credits exhausted.");
        return errResp(500, "AI gateway error");
      }
      const data = await resp.json();
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
      return new Response(args, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return errResp(400, "Unknown mode");
  } catch (e) {
    console.error("live-interview error:", e);
    return errResp(500, e instanceof Error ? e.message : "Unknown");
  }
});

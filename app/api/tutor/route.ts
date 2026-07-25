import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Lazy so the build doesn't crash when OPENAI_API_KEY isn't set yet.
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (_openai) return _openai;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  _openai = new OpenAI({ apiKey });
  return _openai;
}

interface TutorRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  context: {
    lessonTitle: string;
    currentCode: string;
    errorMessage?: string;
    moduleSlug: string;
  };
}

const SYSTEM_PROMPT = `You are a Python and pandas tutor for a self-paced learning site. Your job is to guide discovery, not hand out answers. Struggle is where learning happens. Do not undermine it.

ENVIRONMENT FACTS (mention only when relevant):
- Code runs in the browser via Pyodide in a Web Worker.
- pandas and numpy are preloaded; beautifulsoup4 is preloaded; matplotlib is not.
- requests is NOT available; HTTP fetches go through pyodide.http.pyfetch (async).
- Top-level await works because the runner uses runPythonAsync.

HARD RULES:
- If the student asks for "the answer", "the solution", "just give me the code", or anything synonymous, refuse with one short sentence and offer to take them one step closer instead. Example: "not going to write it for you. tell me which line you've tried and i'll point at the next move."
- If the student asks for "a hint" with no specifics, ask ONE clarifying question first. Examples: "which part is stuck, the groupby or the aggregation?" or "have you run it yet? what did it print?"
- Once the student names a specific block, the hint is a QUESTION that builds intuition, not a code snippet. Bad: "use df.groupby('category')". Good: "if you want one row per category, what verb on the DataFrame collapses rows into groups?"
- Only ever show a full solution if the student explicitly types something like "show me the solution" or "i give up, show it". Even then, walk through it line by line, not as one block.
- If the student pastes a traceback, quote the broken part and ask them what they think it means before explaining.

STYLE:
- Short. Terminal-flavored. No "Great question!" / "Absolutely!" / "I'd be happy to help!" filler.
- Code in fenced blocks tagged python. Mention environment quirks (pyfetch, no requests) only when the question intersects them.
- One thought per message. If you have three things to say, ask which one matters first.

Current context:
- Lesson: {lessonTitle}
- Module: {moduleSlug}
- Current code:
\`\`\`python
{currentCode}
\`\`\`
{errorContext}`;

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(clientIp(request));
    if (!limit.ok) {
      return NextResponse.json(
        { error: "rate limit: too many tutor requests. give it a minute." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const rawBody: unknown = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ error: "invalid request body" }, { status: 400 });
    }
    const body = rawBody as TutorRequest;
    const { messages, context } = body;
    if (!Array.isArray(messages) || !context || typeof context !== "object") {
      return NextResponse.json({ error: "missing required fields: messages, context" }, { status: 400 });
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(
        { error: "AI tutor is not configured on this deployment." },
        { status: 503 },
      );
    }

    const errorContext = context.errorMessage
      ? `- Recent error/traceback: ${context.errorMessage}`
      : "";

    const systemPrompt = SYSTEM_PROMPT.replace("{lessonTitle}", context.lessonTitle || "(unknown)")
      .replace("{moduleSlug}", context.moduleSlug || "(unknown)")
      .replace("{currentCode}", context.currentCode || "(no code yet)")
      .replace("{errorContext}", errorContext);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      max_tokens: 800,
      temperature: 0.6,
    });

    const content = completion.choices[0]?.message?.content ?? "no response generated.";
    return NextResponse.json({ content });
  } catch (err) {
    console.error("[tutor] api error:", err);

    // Surface enough to tell the failure modes apart without leaking the key or the
    // prompt. Previously every upstream problem collapsed into one generic 500, so a
    // dead key, an exhausted quota and a retired model were indistinguishable from the
    // client and the cause had to be guessed at. Status and type only; no message body
    // from upstream, since that can echo request content back.
    const e = err as { status?: number; type?: string; code?: string };
    const status = typeof e?.status === "number" ? e.status : undefined;

    const reason =
      status === 401
        ? "the configured OPENAI_API_KEY was rejected"
        : status === 429
          ? "rate limited or out of quota"
          : status === 404
            ? "the configured model is unavailable to this key"
            : "upstream request failed";

    return NextResponse.json(
      {
        error: `tutor unavailable: ${reason}.`,
        upstreamStatus: status ?? null,
        upstreamCode: e?.code ?? e?.type ?? null,
      },
      { status: 502 },
    );
  }
}

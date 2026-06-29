import { NextResponse } from "next/server";

const API_URL = "https://api.nuoda.vip/v1/messages";

export async function POST(req: Request) {
  try {
    const { notes } = await req.json();

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 密码已经帮你填好了，不要动这一行
        "x-api-key": "sk-r0qzsY2vZmkTyWMBIUSLuFt4qrjg3S9w3mspo0wJxa4yRaxr",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: `You are an expert AEC (Architecture, Engineering, and Construction) Workflow Consultant. 
Return ONLY a pure JSON object with these keys: summary (string), painPoints (string[]), recommendedWorkflow (string), automationFitScore (number 0-100), humanReviewNeed (boolean), successMetrics (string[]).

RULES for successMetrics:
- Every metric must begin with either "Target: " or "Track: " — no exceptions.
- Use "Target: " for directional improvement goals (e.g. "Target: reduce RFI review turnaround time by ~40%").
- Use "Track: " for observability goals (e.g. "Track: rate of discipline owner overrides on RFI drafts").
- Never promise absolute results (no "100%", "0 errors", "eliminate all", "zero").
- Frame targets as directional estimates (e.g. "~30%", "up to 2 hrs/week", "at least 3 of 5 runs").
- Focus on engineering outcomes: design coordination, BIM model integrity, and simulation accuracy.

No markdown, no extra text, no code fences.`,
        messages: [{ role: "user", content: notes }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    let content: string = data.content[0].text;
    content = content.replace(/^```(?:json)?\n?|\n?```$/g, "").trim();

    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

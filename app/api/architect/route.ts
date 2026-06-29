import { NextResponse } from "next/server";

const API_URL = "https://api.nuoda.vip/v1/messages";

export async function POST(req: Request) {
  try {
    const { objective } = await req.json();

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "sk-r0qzsY2vZmkTyWMBIUSLuFt4qrjg3S9w3mspo0wJxa4yRaxr",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: `You are an expert AEC (Architecture, Engineering, and Construction) Workflow Architect.
Return ONLY a pure JSON object with these keys: 
- workflowName (string)
- prototypeGoal (string)
- mvpWorkflowSteps (array of objects: stepName, whatHappens, responsibleAgent, expectedOutput)
- routingRules (string[])
- humanReviewRules (string[])
- structuredOutputSchema (object)
- prototypeToolStack (string[])
- productionToolStack (string[])
- acceptanceCriteria (string[])
- failureHandling (string[])
- metricsToTrack (string[])

RULES:
- Design a sprint-ready 3-5 day MVP plan for engineering automation (e.g. BIM coordination, LCA, or RFI routing).
- Ensure routingRules include clear discipline-specific paths.
- Ensure humanReviewRules define critical engineering gates (e.g. "Structural Lead approval").
- successMetrics MUST begin with "Target: " or "Track: ".
- Use "Target: " for engineering outcomes like ~30% faster coordination.
- Use "Track: " for observability like "Track: discipline owner override rate".
- No markdown, no extra text, no code fences.`,
        messages: [{ role: "user", content: objective }],
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

import { NextResponse } from "next/server";

const API_URL = "https://api.nuoda.vip/v1/messages";

export async function POST(req: Request) {
  try {
    const { objective } = await req.json();

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: `You are an AI Workflow Architect designing automation solutions for 3-5 day client sprints. Your designs must be pragmatic, lightweight, and immediately executable — never over-engineered.

CONCISENESS RULES (apply to every field):
- All string values must be one sentence maximum — no run-ons, no padding.
- Each array must contain 3-5 items maximum.
- stepName: 2-4 words. whatHappens: one sentence under 20 words. expectedOutput: one noun phrase.
- routingRules, humanReviewRules, acceptanceCriteria, failureHandling, metricsToTrack: one sentence each, under 15 words.
- structuredOutputSchema: flat object, 3-5 properties only, no nested objects beyond one level.

SAFETY RULES:
- prototypeToolStack must only contain tools from this list: n8n, Airtable, Slack, Make, Zapier, or Notion. Do NOT include Google Sheets.
- Every tool in prototypeToolStack must be directly referenced by at least one step in mvpWorkflowSteps. Do not add tools that have no corresponding step.
- If the workflow involves any e-commerce order lookups or routing decisions, include a "Simulated Shopify Lookup" step in mvpWorkflowSteps that explicitly describes the order data retrieval.
- productionToolStack must only contain production-grade infrastructure such as Vector DB, Message Queues, Postgres, Redis, Docker, or Kubernetes.
- Prototype mode MUST NOT auto-execute financial actions (refunds, store credits, reshipments, invoice approvals, fund transfers, or any customer-sensitive monetary action). For any such action, the workflow step must only generate a recommended resolution draft and route it to humanReviewRules requiring explicit human approval before any execution.
- Keep mvpWorkflowSteps to 3-6 steps maximum. One clear outcome per step.
- acceptanceCriteria must be measurable and verifiable within 5 business days.

Return ONLY a pure JSON object matching this exact schema — no markdown, no extra text, no code fences:
{
  "workflowName": string,
  "prototypeGoal": string,
  "mvpWorkflowSteps": [{ "stepName": string, "whatHappens": string, "responsibleAgent": string, "expectedOutput": string }],
  "routingRules": string[],
  "humanReviewRules": string[],
  "structuredOutputSchema": object,
  "prototypeToolStack": string[],
  "productionToolStack": string[],
  "acceptanceCriteria": string[],
  "failureHandling": string[],
  "metricsToTrack": string[]
}`,
        messages: [{ role: "user", content: objective }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    let content: string = data.content[0].text;
    // Strip markdown code fences if the model wraps the JSON
    content = content.replace(/^```(?:json)?\n?|\n?```$/g, "").trim();

    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

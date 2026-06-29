import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { objective } = await req.json();

    const response = await fetch("https://api.aigogo.pro/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": "sk-r0qzsY2vZmkTyWMBIUSLuFt4qrjg3S9w3mspo0wJxa4yRaxr",
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        system: "You are an AEC deployment architect. Create a workflow deployment plan. Return a JSON object with: workflowName, prototypeGoal, mvpWorkflowSteps (array of objects with stepName, whatHappens, responsibleAgent, expectedOutput), routingRules (string[]), humanReviewRules (string[]), structuredOutputSchema (object), prototypeToolStack (string[]), productionToolStack (string[]), acceptanceCriteria (string[]), failureHandling (string[]), and metricsToTrack (string[]). Output ONLY valid JSON, no markdown formatting.",
        messages: [
          { role: "user", content: `Design a workflow plan for this objective: ${objective}` }
        ]
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(JSON.stringify(data.error));
    }

    const rawContent = data.content[0].text;
    const cleanContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json(JSON.parse(cleanContent));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

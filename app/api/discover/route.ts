import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { notes } = await req.json();

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
        system: "You are an expert AEC AI consultant. Extract pain points from project notes and return a JSON object with: summary, painPoints (string[]), recommendedWorkflow, automationFitScore (number), humanReviewNeed (boolean), and successMetrics (string[]). Output ONLY valid JSON, no markdown formatting.",
        messages: [
          { role: "user", content: `Analyze these project notes: ${notes}` }
        ]
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(JSON.stringify(data.error));
    }

    const rawContent = data.content[0].text;
    const cleanContent = rawContent.replace(/
```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json(JSON.parse(cleanContent));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```eof

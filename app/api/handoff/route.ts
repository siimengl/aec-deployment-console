import { NextResponse } from "next/server";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";

export async function POST(req: Request) {
  if (!N8N_WEBHOOK_URL) {
    return NextResponse.json(
      { error: "N8N_WEBHOOK_URL is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const plan = await req.json();

    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });

    if (!n8nRes.ok) {
      const text = await n8nRes.text().catch(() => "");
      return NextResponse.json(
        { error: `n8n responded with ${n8nRes.status} ${n8nRes.statusText}${text ? `: ${text}` : ""}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

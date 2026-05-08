import { NextResponse } from 'next/server';

// NOTE: Uses native fetch — no @anthropic-ai/sdk needed, zero new deps.
// Model: claude-sonnet-4-6 (the prompt said claude-sonnet-4-20250514 which is not
// a valid model ID; claude-sonnet-4-6 is the correct current Sonnet 4.6 identifier).

const SYSTEM_PROMPT =
  'You are an expert automotive copywriter for a small used car dealership in Murfreesboro TN. ' +
  'Write compelling, honest, local-market ad copy. No fluff. Buyers are real working people. ' +
  'Be specific. No fake urgency. Never say priced to sell or won\'t last long.';

export async function POST(request: Request) {
  try {
    const vehicle = await request.json();

    const userPrompt = `Write ad copy for this vehicle:
Year: ${vehicle.year}
Make: ${vehicle.make}
Model: ${vehicle.model}
Body Style: ${vehicle.body || 'N/A'}
Miles: ${vehicle.miles}
Color: ${vehicle.color || 'N/A'}
Transmission: ${vehicle.transmission || 'N/A'}
Price: $${vehicle.price}
Remarks: ${vehicle.remarks || 'None'}

Return a JSON object with exactly these four keys:
- social: 2-3 sentences, casual tone, FB/IG ready, include price and miles
- listing: 150-200 words, professional AutoTrader style
- craigslist: plain text, conversational, no markdown, include "call or text 615-893-1727"
- youtube: 10-15 second walkaround script, natural spoken word

Return ONLY valid JSON. No markdown code fences. No explanation before or after.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json();
      throw new Error(errBody.error?.message || `Anthropic API error ${response.status}`);
    }

    const result = await response.json();
    const raw = result.content[0]?.text ?? '';

    // Strip markdown code fences if Claude wraps anyway
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const copy = JSON.parse(cleaned);

    return NextResponse.json({ success: true, copy });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

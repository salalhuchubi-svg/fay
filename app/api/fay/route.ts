import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const systemPrompt = `You are Fay, a personal AI business assistant. You are sharp, confident, and stylish — like a brilliant friend who happens to know everything about TikTok, business strategy, and content creation.

Your personality:
- Warm but direct. No fluff.
- Use casual but smart language.
- You call the user "babe" or by first name occasionally — feels personal.
- You're genuinely excited about their growth.
- Short responses unless they ask for detailed analysis.
- NEVER use emojis. Ever. Not a single one.
- Write responses that sound natural when spoken out loud. No bullet points, no lists — just natural flowing sentences.

Current business context:
${JSON.stringify(context, null, 2)}

You help with:
1. TikTok strategy: analyzing performance, hooks, viral trends by niche, content ideas
2. Business tracking: revenue, expenses, tasks, reminders
3. Notes and ideas capture
4. Social media across all platforms

When suggesting content ideas, always include a specific hook (the first 3 seconds of the video).
When analyzing comments, identify patterns: what viewers want more of, pain points, questions.
When discussing viral trends, be specific about formats, sounds, and hooks currently working.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; text: string }) => ({
        role: m.role === "fay" ? "assistant" : "user",
        content: m.text,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Fay API error:", err);
    return NextResponse.json(
      { text: "Sorry, I had a problem connecting. Check your API key in .env.local." },
      { status: 500 }
    );
  }
}

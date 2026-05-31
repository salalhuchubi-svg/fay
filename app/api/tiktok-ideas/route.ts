import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { niche, topVideos, recentComments } = await req.json();

  const prompt = `You are a TikTok content strategist. Analyze this account data and generate 5 high-potential content ideas.

Niche: ${niche}
Top performing videos: ${JSON.stringify(topVideos)}
Recent comment themes: ${recentComments || "none provided"}

For each idea provide:
1. Video concept (1 sentence)
2. Hook (the exact first 3 seconds spoken or shown)
3. Why it will perform (based on the data)
4. Best posting time

Format as JSON array: [{ "concept": "", "hook": "", "reason": "", "timing": "" }]
Only return the JSON, no other text.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";
  try {
    const ideas = JSON.parse(text);
    return NextResponse.json({ ideas });
  } catch {
    return NextResponse.json({ ideas: [] });
  }
}

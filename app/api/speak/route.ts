import { NextRequest, NextResponse } from "next/server";

// Alyx — British male
const VOICE_ID = "1BUhH8aaMvGMUdGAmWVM";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

    const clean = text
      .replace(/[#*_~`]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 500); // ElevenLabs free tier limit

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: clean,
          model_id: "eleven_turbo_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[speak] ElevenLabs error:", err);
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[speak] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

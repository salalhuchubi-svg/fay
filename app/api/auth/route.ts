import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correct = process.env.FAY_PASSWORD || "fay2024";

  if (password === correct) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("fay_auth", correct, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}

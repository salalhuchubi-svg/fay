import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = "tikapi.p.rapidapi.com";

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: "No username" }, { status: 400 });

    // Get user profile
    const profileRes = await fetch(
      `https://tikapi.p.rapidapi.com/public/check?username=${encodeURIComponent(username)}`,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
          "Content-Type": "application/json",
        },
      }
    );

    if (!profileRes.ok) {
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 400 });
    }

    const profileData = await profileRes.json();
    const user = profileData?.userInfo?.user;
    const stats = profileData?.userInfo?.stats;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const followers = stats?.followerCount || 0;
    const secUid = user?.secUid || "";

    // Get recent videos
    let videos: {
      id: string;
      title: string;
      hook: string;
      views: number;
      likes: number;
      comments: number;
      shares: number;
      date: string;
    }[] = [];

    if (secUid) {
      const videosRes = await fetch(
        `https://tikapi.p.rapidapi.com/public/posts?secUid=${encodeURIComponent(secUid)}&count=20`,
        {
          headers: {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST,
            "Content-Type": "application/json",
          },
        }
      );

      if (videosRes.ok) {
        const videosData = await videosRes.json();
        const items = videosData?.itemList || [];
        videos = items.map((item: {
          id: string;
          desc: string;
          stats: { playCount: number; diggCount: number; commentCount: number; shareCount: number };
          createTime: number;
        }) => ({
          id: item.id,
          title: item.desc || "Untitled",
          hook: item.desc?.slice(0, 80) || "",
          views: item.stats?.playCount || 0,
          likes: item.stats?.diggCount || 0,
          comments: item.stats?.commentCount || 0,
          shares: item.stats?.shareCount || 0,
          date: new Date((item.createTime || 0) * 1000).toISOString(),
        }));
      }
    }

    return NextResponse.json({
      username: user.uniqueId || username,
      followers,
      secUid,
      avatar: user.avatarThumb || "",
      videos,
    });
  } catch (err) {
    console.error("TikTok sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

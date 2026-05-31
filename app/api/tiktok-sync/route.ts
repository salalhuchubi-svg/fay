import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = "tiktok-scraper7.p.rapidapi.com";

async function tikFetch(path: string) {
  const res = await fetch(`https://${RAPIDAPI_HOST}${path}`, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  console.log(`[tiktok-sync] ${path.slice(0, 60)} -> ${res.status}: ${text.slice(0, 200)}`);
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 150)}`);
  return JSON.parse(text);
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: "No username" }, { status: 400 });

    const cleanUsername = username.replace("@", "").trim();

    // Get user detail by unique_id
    let followers = 0;
    try {
      const detailData = await tikFetch(`/user/info?unique_id=${encodeURIComponent(cleanUsername)}`);
      const stats = detailData?.data?.stats || detailData?.stats || {};
      const user = detailData?.data?.user || detailData?.user || {};
      followers =
        stats?.followerCount ||
        user?.follower_count ||
        user?.fans ||
        0;
    } catch (e) {
      console.log("[tiktok-sync] detail fetch failed:", e);
    }

    // Get user posts by unique_id
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

    const postsData = await tikFetch(
      `/user/posts?unique_id=${encodeURIComponent(cleanUsername)}&count=20&cursor=0&sort_type=0`
    );

    const items = postsData?.data?.videos || postsData?.data?.items || postsData?.videos || [];

    if (Array.isArray(items)) {
      videos = items.map((item: {
        aweme_id?: string;
        video_id?: string;
        id?: string;
        desc?: string;
        title?: string;
        play_count?: number;
        digg_count?: number;
        comment_count?: number;
        share_count?: number;
        statistics?: { play_count?: number; digg_count?: number; comment_count?: number; share_count?: number };
        create_time?: number;
      }) => ({
        id: item.aweme_id || item.video_id || item.id || String(Date.now() + Math.random()),
        title: item.title || item.desc || "Untitled",
        hook: (item.title || item.desc || "").slice(0, 80),
        views: item.play_count || item.statistics?.play_count || 0,
        likes: item.digg_count || item.statistics?.digg_count || 0,
        comments: item.comment_count || item.statistics?.comment_count || 0,
        shares: item.share_count || item.statistics?.share_count || 0,
        date: new Date((item.create_time || 0) * 1000).toISOString(),
      }));
    }

    return NextResponse.json({ username: cleanUsername, followers, videos });
  } catch (err) {
    console.error("[tiktok-sync] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

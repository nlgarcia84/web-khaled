import type { APIRoute } from "astro";
import { getStream } from "../../lib/sanity";
import { getLiveStream } from "../../lib/youtube";

export const GET: APIRoute = async ({ url }) => {
  const videoId = url.searchParams.get("videoId");

  let isLive: boolean;
  let liveVideoId: string | null = null;

  if (videoId) {
    isLive = await isVideoLive(videoId);
    if (isLive) liveVideoId = videoId;
  } else {
    const stream = await getStream();
    const channelId = stream?.channelId ?? "";
    const live = channelId ? await getLiveStream(channelId) : null;
    isLive = live !== null;
    liveVideoId = live?.videoId ?? null;
  }

  return new Response(
    JSON.stringify({ isLive, videoId: liveVideoId }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

async function isVideoLive(videoId: string): Promise<boolean> {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY || !videoId) return false;

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${API_KEY}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      items?: Array<{ liveStreamingDetails?: { actualEndTime?: string } }>;
    };

    const details = data.items?.[0]?.liveStreamingDetails;
    if (!details) return false;
    return !details.actualEndTime;
  } catch {
    return false;
  }
}
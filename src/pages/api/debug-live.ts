import type { APIRoute } from "astro";
import { getStream } from "../../lib/sanity";

export const GET: APIRoute = async () => {
  const diag: Record<string, unknown> = {};

  diag.hasApiKey = !!process.env.YOUTUBE_API_KEY;
  diag.apiKeyPrefix = process.env.YOUTUBE_API_KEY
    ? process.env.YOUTUBE_API_KEY.substring(0, 8) + "..."
    : "NOT SET";

  try {
    const stream = await getStream();
    diag.streamExists = !!stream;
    diag.channelId = stream?.channelId ?? "NOT SET";

    if (stream?.channelId) {
      const API_KEY = process.env.YOUTUBE_API_KEY;
      if (API_KEY) {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${stream.channelId}&eventType=live&type=video&key=${API_KEY}`;
        const res = await fetch(url);
        const data = (await res.json()) as Record<string, unknown>;
        diag.youtubeStatus = res.status;
        diag.youtubeError = data.error ?? null;
        diag.youtubeItems = Array.isArray(data.items) ? data.items.length : "N/A";
        if (Array.isArray(data.items) && data.items.length > 0) {
          const item = data.items[0] as Record<string, unknown>;
          diag.videoId = (item.id as Record<string, string>)?.videoId ?? "N/A";
          diag.videoTitle = (item.snippet as Record<string, string>)?.title ?? "N/A";
        }
      }
    }
  } catch (err) {
    diag.error = String(err);
  }

  return new Response(JSON.stringify(diag, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

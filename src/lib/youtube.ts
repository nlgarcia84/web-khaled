const API_KEY = process.env.YOUTUBE_API_KEY;
const YT_API = "https://www.googleapis.com/youtube/v3";

export interface LiveStream {
  videoId: string;
  title: string;
  thumbnail: string;
}

let _cache: { data: LiveStream | null; ts: number } | null = null;
const CACHE_TTL = 30_000;

function parseFirstVideoId(xml: string): string | null {
  const m = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  return m ? m[1] : null;
}

export async function getLiveStream(
  channelId: string,
): Promise<LiveStream | null> {
  if (!API_KEY || !channelId) return null;

  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return _cache.data;
  }

  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssRes = await fetch(rssUrl);
    const xml = await rssRes.text();
    const videoId = parseFirstVideoId(xml);

    if (!videoId) {
      _cache = { data: null, ts: Date.now() };
      return null;
    }

    const apiUrl = `${YT_API}/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${API_KEY}`;
    const apiRes = await fetch(apiUrl);
    const data = (await apiRes.json()) as {
      error?: { code: number; message: string };
      items?: Array<{
        snippet: { title: string; thumbnails: { medium: { url: string } } };
        liveStreamingDetails?: { actualEndTime?: string };
      }>;
    };

    if (data.error) {
      console.error("YouTube API error:", data.error.code, data.error.message);
      return null;
    }

    const video = data.items?.[0];
    if (!video?.liveStreamingDetails) {
      _cache = { data: null, ts: Date.now() };
      return null;
    }

    const isLive = !video.liveStreamingDetails.actualEndTime;
    if (!isLive) {
      _cache = { data: null, ts: Date.now() };
      return null;
    }

    const result: LiveStream = {
      videoId,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.medium.url,
    };
    _cache = { data: result, ts: Date.now() };
    return result;
  } catch (err) {
    console.error("YouTube API error:", err);
    return null;
  }
}

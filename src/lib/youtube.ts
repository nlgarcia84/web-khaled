const YT_API = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY;

export interface LiveStream {
  videoId: string;
  title: string;
  thumbnail: string;
}

let _cache: { data: LiveStream | null; ts: number } | null = null;
const CACHE_TTL = 120_000;

export async function getLiveStream(
  channelId: string,
): Promise<LiveStream | null> {
  if (!API_KEY || !channelId) return null;

  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return _cache.data;
  }

  try {
    const url = `${YT_API}/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${API_KEY}`;

    const res = await fetch(url);
    const data = (await res.json()) as {
      error?: { code: number; message: string };
      items?: Array<{
        id: { videoId: string };
        snippet: {
          title: string;
          thumbnails: { medium: { url: string } };
        };
      }>;
    };

    if (data.error) {
      console.error("YouTube API error:", data.error.code, data.error.message);
      return null;
    }

    if (!data.items?.length) {
      _cache = { data: null, ts: Date.now() };
      return null;
    }

    const item = data.items[0];
    const result: LiveStream = {
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
    };
    _cache = { data: result, ts: Date.now() };
    return result;
  } catch (err) {
    console.error("YouTube API error:", err);
    return null;
  }
}

export async function getLiveStreamCached(channelId: string): Promise<LiveStream | null> {
  if (!_cache || Date.now() - _cache.ts >= CACHE_TTL) {
    return getLiveStream(channelId);
  }
  return _cache.data;
}

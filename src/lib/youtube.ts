const YT_API = "https://www.googleapis.com/youtube/v3";
const API_KEY = import.meta.env.YOUTUBE_API_KEY;

export interface LiveStream {
  videoId: string;
  title: string;
  thumbnail: string;
}

export async function getLiveStream(
  channelId: string,
): Promise<LiveStream | null> {
  if (!API_KEY || !channelId) return null;

  try {
    const url = `${YT_API}/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${API_KEY}`;

    const res = await fetch(url);
    const data = (await res.json()) as {
      items?: Array<{
        id: { videoId: string };
        snippet: {
          title: string;
          thumbnails: { medium: { url: string } };
        };
      }>;
    };

    if (!data.items?.length) return null;

    const item = data.items[0];
    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
    };
  } catch (err) {
    console.error("YouTube API error:", err);
    return null;
  }
}

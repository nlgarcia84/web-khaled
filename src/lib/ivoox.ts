export interface Episode {
  id: string;
  title: string;
  link: string;
  audioUrl: string;
  description: string;
  pubDate: string;
  duration: string;
  image?: string;
}

export interface PodcastFeed {
  title: string;
  description: string;
  image: string;
  episodes: Episode[];
}

let _cache: { data: PodcastFeed | null; ts: number } | null = null;
const CACHE_TTL = 15 * 60_000;

const FEED_URL =
  "https://www.ivoox.com/khaled-huerta_fg_f11766594_filtro_1.xml";

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#xA0;/g, " ")
    .replace(/&nbsp;/g, " ");
}

function extractField(tag: string, xml: string): string {
  const open = new RegExp(`<${tag}(?:\\s|>)`, "i").exec(xml);
  if (!open || open.index === undefined) return "";
  const start = xml.indexOf(">", open.index) + 1;
  const close = xml.indexOf(`</${tag}>`, start);
  if (close === -1) return "";
  return xml.slice(start, close).replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

function extractDuration(xml: string): string {
  const m = xml.match(/<itunes:duration>([^<]+)<\/itunes:duration>/i);
  return m ? m[1].trim() : "";
}

function extractImage(xml: string): string {
  const m = xml.match(/<itunes:image\s+href="([^"]+)"/i);
  return m ? m[1] : "";
}

function normalizeDuration(duration: string): string {
  const parts = duration.split(":").map(Number);
  return parts.length === 3 && parts[0] > 0 ? parts.join(":") : duration;
}

export async function getEpisodes(): Promise<PodcastFeed> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL && _cache.data) {
    return _cache.data;
  }

  try {
    const res = await fetch(FEED_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) throw new Error(`iVoox feed HTTP ${res.status}`);
    const xml = await res.text();

    const itemRe = /<item>[\s\S]*?<\/item>/gi;
    const items = xml.match(itemRe) ?? [];

    const episodes: Episode[] = items.map((item) => {
      const enclosure = item.match(/<enclosure\s+url="([^"]+)"/i);
      const guid = item.match(/<guid>([^<]+)<\/guid>/i);
      const link = item.match(/<link>([^<]+)<\/link>/i);
      return {
        id: guid ? (guid[1].split("/").pop() ?? "") : "",
        title: decodeEntities(extractField("title", item)),
        link: link ? link[1].trim() : "",
        audioUrl: enclosure ? enclosure[1] : "",
        description: decodeEntities(extractField("description", item)),
        pubDate: extractField("pubDate", item),
        duration: normalizeDuration(extractDuration(item)),
        image: extractImage(item),
      };
    });

    const feed: PodcastFeed = {
      title: decodeEntities(extractField("title", xml)) || "Khaled Huerta",
      description: decodeEntities(extractField("description", xml)),
      image: extractImage(xml),
      episodes,
    };
    _cache = { data: feed, ts: Date.now() };
    return feed;
  } catch (err) {
    console.error("iVoox feed error:", err);
    return _cache?.data ?? { title: "Khaled Huerta", description: "", image: "", episodes: [] };
  }
}
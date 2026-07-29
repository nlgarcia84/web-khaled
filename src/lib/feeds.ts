export async function getLatestInstagramPost(username: string) {
  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();
    const match = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
    if (!match) return null;
    const data = JSON.parse(match[1]);
    const edge = data?.items?.edges?.[0]?.node || data?.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_owner_to_timeline_media?.edges?.[0]?.node;
    if (!edge) return null;
    return {
      id: edge.shortcode,
      caption: edge.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 120) || "",
      thumbnail: edge.thumbnail_src || edge.display_url,
      url: `https://www.instagram.com/p/${edge.shortcode}/`,
    };
  } catch {
    return null;
  }
}

export async function getLatestTelegramPost(username: string) {
  try {
    const res = await fetch(`https://t.me/s/${username}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();
    const textMatch = html.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const dateMatch = html.match(/<time datetime="([^"]+)"/);
    if (!textMatch) return null;
    const text = textMatch[1].replace(/<[^>]*>/g, "").slice(0, 150);
    const date = dateMatch?.[1] || "";
    return { text, date, url: `https://t.me/s/${username}` };
  } catch {
    return null;
  }
}

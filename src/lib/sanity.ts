import { createClient } from "@sanity/client";

const projectId = "6flkjd1o";
const dataset = "production";

export const client = createClient({
  projectId,
  dataset,
  useCdn: true,
  apiVersion: "2024-01-01",
});

export const writeClient = createClient({
  projectId,
  dataset,
  useCdn: false,
  apiVersion: "2024-01-01",
  token: import.meta.env.SANITY_TOKEN,
});

export async function getPosts() {
  return await client.fetch(`*[_type == "post"] | order(publishedAt desc) {
    title,
    slug,
    author,
    excerpt,
    image,
    publishedAt,
    categories[]->{title},
  }`);
}

export async function getPost(slug: string) {
  return await client.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
    title,
    slug,
    author,
    excerpt,
    image,
    body,
    publishedAt,
  }`,
    { slug },
  );
}

export async function getCampaign(slug: string) {
  return await client.fetch(
    `*[_type == "campaign" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    goal,
    raised,
    description,
    active,
  }`,
    { slug },
  );
}

export async function getStream() {
  return await client.fetch(
    `*[_type == "stream"][0] {
    title,
    youtubeVideoId,
    isLive,
    chatEnabled,
  }`,
  );
}

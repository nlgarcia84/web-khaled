import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "6flkjd1o",
  dataset: "production",
  useCdn: true,
  apiVersion: "2024-01-01",
});

export async function getPosts() {
  return await client.fetch(`*[_type == "post"] | order(publishedAt desc) {
    title,
    slug,
    excerpt,
    publishedAt,
  }`);
}

export async function getPost(slug: string) {
  return await client.fetch(`*[_type == "post" && slug.current == $slug][0] {
    title,
    slug,
    author,
    excerpt,
    body,
    publishedAt,
  }`, { slug });
}

import { createClient } from "@sanity/client";

/**
 * Sanity CMS — clientes y consultas.
 *
 * - `client`    → solo lectura, cache CDN para velocidad
 * - `writeClient` → autenticado con token SANITY_TOKEN para mutaciones (webhooks)
 *
 * Tipos de documento: post, campaign, stream, documento, blockContent, category
 * Studio URL: https://khaled-blog.sanity.studio/
 */

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
  token: process.env.SANITY_TOKEN,
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
  return await client.fetch<{
    title: string;
    channelId: string;
    chatEnabled: boolean;
  }>(
    `*[_type == "stream"][0] {
    title,
    channelId,
    chatEnabled,
  }`,
  );
}

export async function getDocumentos() {
  return await client.fetch<
    Array<{
      _id: string;
      title: string;
      fileId: string;
      type: string;
      description: string;
    }>
  >(
    `*[_type == "documento"] | order(title asc) {
    _id,
    title,
    fileId,
    type,
    description,
  }`,
  );
}

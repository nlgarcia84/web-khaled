import type { APIRoute } from "astro";
import { writeClient } from "../../../lib/sanity";

/**
 * Incrementa el contador de likes de un post.
 *
 * @route   POST /api/likes/[slug]
 * @param   {string} slug - Slug del post (viene en la URL)
 * @returns {object} { likes: number } - Nuevo total tras el incremento
 *
 * Se llama desde el LikeButton del frontend. Usa writeClient (sin cache CDN)
 * tanto para la escritura como para leer el total actualizado.
 */

export const POST: APIRoute = async ({ params }) => {
  try {
    // 1. El slug viene en la URL (segmento dinámico [slug]), no en el body.
    //    `params` es provisto por Astro con los segmentos de la ruta.
    const { slug } = params;

    // 2. Validación de entrada: si no hay slug, no podemos hacer nada.
    if (!slug) {
      return new Response(JSON.stringify({ error: "Falta slug" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Sanity usa `_id` (no slug) para parchear documentos, así que
    //    primero buscamos el `_id` del post que coincide con el slug.
    //    `[0]._id` en GROQ = "trae solo el _id del primer resultado".
    const postId = await writeClient.fetch(
      `*[_type == "post" && slug.current == $slug][0]._id`,
      { slug },
    );

    // 4. Si el post no existe, la búsqueda devuelve null → 404.
    if (!postId) {
      return new Response(JSON.stringify({ error: "Post no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Incremento atómico: suma 1 al campo `likes`.
    //    `setIfMissing` cubre posts antiguos que no tienen el campo (los
    //    creados antes de añadir `initialValue` al schema). Si no existe,
    //    lo crea en 0 y luego `inc` le suma 1. `inc` es atómico: dos likes
    //    simultáneos no se pierden.
    const transaction = writeClient.transaction();
    transaction.patch(postId, (p) => p.setIfMissing({ likes: 0 }).inc({ likes: 1 }));
    await transaction.commit();

    // 6. Leemos el total actualizado. Importante: usamos `writeClient`
    //    (useCdn: false) porque `client` usa cache CDN y devolvería
    //    el número viejo.
    const likes = await writeClient.fetch(
      `*[_type == "post" && slug.current == $slug][0].likes`,
      { slug },
    );

    return new Response(JSON.stringify({ likes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error registering like:", err);
    return new Response(JSON.stringify({ error: "Error al registrar el like" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

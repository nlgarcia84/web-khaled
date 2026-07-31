import { defineField, defineType } from "sanity";

export default defineType({
  name: "stream",
  title: "Transmisión en vivo",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "youtubeVideoId",
      title: "YouTube Video ID",
      description:
        'Solo el ID del video, ej: "dQw4w9WgXcQ" (no la URL completa)',
      type: "string",
    }),
    defineField({
      name: "isLive",
      title: "¿En directo?",
      description: "Actívalo cuando estés transmitiendo en vivo",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "chatEnabled",
      title: "Chat en vivo habilitado",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "title", isLive: "isLive" },
    prepare({ title, isLive }) {
      return {
        title,
        subtitle: isLive ? "🔴 En directo" : "⚫ Fuera de línea",
      };
    },
  },
});

import { defineField, defineType } from "sanity";

export default defineType({
  name: "stream",
  title: "Transmisión en vivo",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título de la sección",
      type: "string",
      initialValue: "Jutbas en directo",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "channelId",
      title: "YouTube Channel ID",
      description: "ID del canal de YouTube para detectar transmisiones en vivo automáticamente",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "chatEnabled",
      title: "Chat en vivo",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title, subtitle: "Detección automática de directos" };
    },
  },
});

import { defineField, defineType } from "sanity";

export default defineType({
  name: "documento",
  title: "Documento",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "fileId",
      title: "Google Drive File ID",
      description:
        'El ID del archivo en Google Drive (ej: "1aBcDeFgHiJkLmNoPqRsTuVwXyZ"). Asegúrate de que el archivo esté compartido como "Cualquiera con el enlace puede ver".',
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "type",
      title: "Tipo",
      type: "string",
      options: {
        list: [
          { title: "PDF", value: "pdf" },
          { title: "Documento (DOCX)", value: "docx" },
          { title: "Otro", value: "other" },
        ],
      },
      initialValue: "pdf",
    }),
    defineField({
      name: "description",
      title: "Descripción",
      type: "text",
    }),
  ],
  preview: {
    select: { title: "title", type: "type" },
    prepare({ title, type }) {
      const icon = type === "pdf" ? "📄" : type === "docx" ? "📝" : "📁";
      return { title, subtitle: `${icon} ${type?.toUpperCase()}` };
    },
  },
});

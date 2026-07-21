import {defineType} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    {name: 'title', title: 'Título', type: 'string', validation: rule => rule.required()},
    {name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: rule => rule.required()},
    {name: 'author', title: 'Autor', type: 'string', initialValue: 'Sheij Khaled Huerta'},
    {name: 'excerpt', title: 'Resumen', type: 'text', rows: 3},
    {name: 'body', title: 'Contenido', type: 'blockContent'},
    {name: 'categories', title: 'Categorías', type: 'array', of: [{type: 'reference', to: {type: 'category'}}]},
    {name: 'publishedAt', title: 'Fecha de publicación', type: 'datetime', initialValue: () => new Date().toISOString()},
  ],
  preview: {
    select: {title: 'title', subtitle: 'publishedAt'},
  },
})

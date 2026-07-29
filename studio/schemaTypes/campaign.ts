import {defineType} from 'sanity'

export default defineType({
  name: 'campaign',
  title: 'Campaña',
  type: 'document',
  fields: [
    {name: 'title', title: 'Título', type: 'string', validation: rule => rule.required()},
    {name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: rule => rule.required()},
    {name: 'goal', title: 'Meta (€)', type: 'number', validation: rule => rule.required().positive()},
    {name: 'raised', title: 'Recaudado (€)', type: 'number', initialValue: 0, validation: rule => rule.min(0)},
    {name: 'description', title: 'Descripción', type: 'text', rows: 3},
    {name: 'active', title: 'Activa', type: 'boolean', initialValue: true},
  ],
  preview: {
    select: {title: 'title', goal: 'goal', raised: 'raised', active: 'active'},
    prepare({title, goal, raised, active}) {
      const pct = goal > 0 ? Math.round((raised / goal) * 100) : 0
      return {title, subtitle: `${raised}€ / ${goal}€ (${pct}%) ${active ? '●' : '○'}`}
    },
  },
})

import {defineType} from 'sanity'

export default defineType({
  name: 'donation',
  title: 'Donación',
  type: 'document',
  fields: [
    {name: 'amount', title: 'Cantidad (€)', type: 'number', validation: rule => rule.required().positive()},
    {name: 'initials', title: 'Iniciales', type: 'string', maxLength: 3},
    {name: 'campaign', title: 'Campaña', type: 'reference', to: {type: 'campaign'}, validation: rule => rule.required()},
    {name: 'method', title: 'Método', type: 'string', options: {list: [
      {title: 'Tarjeta (Stripe)', value: 'stripe'},
      {title: 'PayPal', value: 'paypal'},
      {title: 'Transferencia', value: 'transfer'},
    ]}},
    {name: 'createdAt', title: 'Fecha', type: 'datetime', initialValue: () => new Date().toISOString()},
  ],
  preview: {
    select: {initials: 'initials', amount: 'amount', createdAt: 'createdAt'},
    prepare({initials, amount, createdAt}) {
      return {
        title: initials || 'Anónimo',
        subtitle: `${amount}€ — ${createdAt ? new Date(createdAt).toLocaleDateString('es') : ''}`,
      }
    },
  },
})

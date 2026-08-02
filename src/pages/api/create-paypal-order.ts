import type { APIRoute } from "astro";
import { createPayPalOrder } from "../../lib/paypal";

/**
 * Crea una orden de PayPal para donaciones.
 *
 * @route   POST /api/create-paypal-order
 * @param   {number} amount        - Cantidad en euros
 * @param   {string} [campaignSlug] - Slug de campaña (se guarda en custom_id)
 * @returns {object} { id: string } ID de la orden para el SDK de PayPal
 *
 * Flujo: frontend PayPal SDK → este endpoint → PayPal popup → capture-paypal-order → Sanity
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const { amount, campaignSlug } = await request.json();

    if (!amount || amount < 1) {
      return new Response(JSON.stringify({ error: "Cantidad inválida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const order = await createPayPalOrder(amount, campaignSlug || undefined);

    return new Response(JSON.stringify({ id: order.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error creating PayPal order:", err);
    return new Response(JSON.stringify({ error: "Error al crear la orden" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

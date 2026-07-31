import type { APIRoute } from "astro";
import { createPayPalOrder } from "../../lib/paypal";

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

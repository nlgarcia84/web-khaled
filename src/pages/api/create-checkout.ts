import type { APIRoute } from "astro";
import Stripe from "stripe";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY ?? "");

export const POST: APIRoute = async ({ request }) => {
  try {
    const { amount, campaignSlug } = await request.json();

    if (!amount || amount < 1) {
      return new Response(JSON.stringify({ error: "Cantidad inválida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Donación - Alfombra para la Musala",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        campaignSlug,
      },
      success_url: `${request.headers.get("origin")}/alfombra?donacion=exito`,
      cancel_url: `${request.headers.get("origin")}/alfombra`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: "Error al procesar el pago" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

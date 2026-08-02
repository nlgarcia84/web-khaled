import type { APIRoute } from "astro";
import Stripe from "stripe";

/**
 * Crea una sesión de Stripe Checkout para donaciones.
 *
 * @route   POST /api/create-checkout
 * @param   {number} amount        - Cantidad en euros (mínimo 1)
 * @param   {string} [campaignSlug] - Slug de campaña en Sanity (si no se pasa, es donación general)
 * @returns {object} { url: string } URL de la sesión de Stripe para redirigir al usuario
 *
 * Flujo: frontend → este endpoint → Stripe Checkout → webhook → Sanity
 */
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

    const isGeneral = !campaignSlug;
    const productName = isGeneral ? "Donación general - Musala" : "Donación - Alfombra para la Musala";
    const origin = request.headers.get("origin") || "https://www.khaledhuerta.com";

    const metadata: Record<string, string> = {};
    if (campaignSlug) metadata.campaignSlug = campaignSlug;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: productName },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${origin}/donar?donacion=exito`,
      cancel_url: `${origin}/donar`,
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

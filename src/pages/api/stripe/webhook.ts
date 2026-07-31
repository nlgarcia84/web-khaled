import type { APIRoute } from "astro";
import Stripe from "stripe";
import { writeClient } from "../../../lib/sanity";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-01-01",
});
const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  const body = Buffer.from(await request.arrayBuffer());
  const sig = request.headers.get("stripe-signature");

  if (!endpointSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return new Response("Server Error", { status: 500 });
  }

  if (!sig) {
    console.error("Missing stripe-signature header");
    return new Response("Bad Request", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Stripe signature verification failed:", err instanceof Error ? err.message : err);
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const campaignSlug = session.metadata?.campaignSlug;
    const amount = session.amount_total ? session.amount_total / 100 : 0;

    if (amount <= 0) {
      return new Response("Invalid amount", { status: 400 });
    }

    if (!campaignSlug) {
      console.log(`Stripe general donation: ${amount}€`);
      return new Response("OK", { status: 200 });
    }

    try {
      const campaign = await writeClient.fetch(
        `*[_type == "campaign" && slug.current == $slug][0]._id`,
        { slug: campaignSlug },
      );

      if (!campaign) {
        console.error("Campaign not found:", campaignSlug);
        return new Response("Campaign not found", { status: 404 });
      }

      const transaction = writeClient.transaction();
      transaction.patch(campaign, (p) => p.inc({ raised: amount }));
      await transaction.commit();
      console.log(`Stripe donation: ${amount}€ → "${campaignSlug}"`);
    } catch (err) {
      console.error("Error updating Sanity:", err);
      return new Response("Server Error", { status: 500 });
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const amount = charge.amount_refunded / 100;
    console.log(`Stripe refund: ${amount}€ refunded. Charge: ${charge.id}`);
  }

  return new Response("OK", { status: 200 });
};

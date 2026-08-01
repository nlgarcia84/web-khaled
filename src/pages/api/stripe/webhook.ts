import type { APIRoute } from "astro";
import Stripe from "stripe";
import { writeClient } from "../../../lib/sanity";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-01-01",
});

const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !endpointSecret) {
    console.error("Missing signature or secret");
    return new Response("Server Error", { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error(
      "Stripe signature failed:",
      err instanceof Error ? err.message : err,
    );
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const campaignSlug = session.metadata?.campaignSlug;
    const amount = session.amount_total ? session.amount_total / 100 : 0;

    if (amount <= 0) return new Response("OK", { status: 200 });

    if (!campaignSlug) {
      console.log(`General donation: ${amount}€`);
      return new Response("OK", { status: 200 });
    }

    try {
      const campaign = await writeClient.fetch(
        `*[_type == "campaign" && slug.current == $slug][0]._id`,
        { slug: campaignSlug },
      );

      if (!campaign) {
        console.error("Campaign not found:", campaignSlug);
        return new Response("OK", { status: 200 });
      }

      const t = writeClient.transaction();
      t.patch(campaign, (p) => p.inc({ raised: amount }));
      await t.commit();
      console.log(`Donation: ${amount}€ → "${campaignSlug}"`);
    } catch (err) {
      console.error(
        "Sanity update failed:",
        err instanceof Error ? err.message : err,
      );
      return new Response("Server Error", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
};

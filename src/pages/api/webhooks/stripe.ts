import type { APIRoute } from "astro";
import Stripe from "stripe";
import { writeClient } from "../../../lib/sanity";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY ?? "");
const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const campaignSlug = session.metadata?.campaignSlug;
    const amount = session.amount_total ? session.amount_total / 100 : 0;

    if (!campaignSlug || amount <= 0) {
      return new Response("Missing metadata", { status: 400 });
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
      transaction.create({
        _type: "donation",
        amount,
        initials: "",
        campaign: { _type: "reference", _ref: campaign },
        method: "stripe",
        createdAt: new Date().toISOString(),
      });
      transaction.patch(campaign, (p) => p.inc({ raised: amount }));
      await transaction.commit();
    } catch (err) {
      console.error("Error updating Sanity:", err);
      return new Response("Server Error", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
};

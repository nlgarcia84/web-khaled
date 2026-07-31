import type { APIRoute } from "astro";
import Stripe from "stripe";
import crypto from "crypto";
import { writeClient } from "../../../lib/sanity";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-01-01",
});
const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

function verifySignature(payload: string, sig: string, secret: string): boolean {
  const parts = sig.split(",").reduce(
    (acc, part) => {
      const [k, v] = part.split("=");
      acc[k] = v;
      return acc;
    },
    {} as Record<string, string>,
  );

  if (!parts.t || !parts.v1) return false;

  const signedPayload = `${parts.t}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(parts.v1, "utf8"),
    );
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!endpointSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Server Error", { status: 500 });
  }

  if (!sig || !verifySignature(body, sig, endpointSecret)) {
    console.error("Stripe webhook: signature verification failed");
    return new Response("Webhook Error", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = JSON.parse(body) as Stripe.Event;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
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

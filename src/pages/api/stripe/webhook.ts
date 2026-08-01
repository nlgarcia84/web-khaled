import type { APIRoute } from "astro";
import Stripe from "stripe";
import { writeClient } from "../../../lib/sanity";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-01-01",
});

const SECRETS = [
  import.meta.env.STRIPE_WEBHOOK_SECRET,
  "whsec_np9FTYGuarFCZK9Fdp2VuoTuxcPke2n0",
].filter(Boolean) as string[];

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  console.log("Webhook body length:", body.length, "sig:", sig?.slice(0, 30));

  if (!sig) {
    return new Response("Bad Request", { status: 400 });
  }

  for (const secret of SECRETS) {
    try {
      const event = stripe.webhooks.constructEvent(body, sig, secret);
      console.log("Secret matched!");
      
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const campaignSlug = session.metadata?.campaignSlug;
        const amount = session.amount_total ? session.amount_total / 100 : 0;

        if (amount > 0 && campaignSlug) {
          const campaign = await writeClient.fetch(
            `*[_type == "campaign" && slug.current == $slug][0]._id`,
            { slug: campaignSlug },
          );
          if (campaign) {
            const t = writeClient.transaction();
            t.patch(campaign, (p) => p.inc({ raised: amount }));
            await t.commit();
            console.log(`Donation: ${amount}€ → "${campaignSlug}"`);
          }
        }
      }
      return new Response("OK", { status: 200 });
    } catch (err) {
      console.log("Secret failed:", err instanceof Error ? err.message.slice(0, 60) : err);
    }
  }

  return new Response("Webhook Error", { status: 400 });
};

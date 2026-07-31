import type { APIRoute } from "astro";
import { writeClient } from "../../../lib/sanity";

const PAYPAL_URL = "https://ipnpb.paypal.com/cgi-bin/webscr";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();

  try {
    const verifyResponse = await fetch(PAYPAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `cmd=_notify-validate&${body}`,
    });

    const verification = await verifyResponse.text();

    if (verification !== "VERIFIED") {
      console.warn("PayPal IPN verification failed");
      return new Response("INVALID", { status: 400 });
    }

    const params = new URLSearchParams(body);

    const paymentStatus = params.get("payment_status");
    const amount = params.get("mc_gross");
    const currency = params.get("mc_currency");
    const payerEmail = params.get("payer_email");
    const txnId = params.get("txn_id");
    const custom = params.get("custom");

    if (paymentStatus !== "Completed") {
      console.log(`PayPal IPN: status "${paymentStatus}", skipping`);
      return new Response("OK", { status: 200 });
    }

    console.log(`PayPal IPN verified: ${amount} ${currency} from ${payerEmail} [${txnId}]`);

    const value = amount ? parseFloat(amount) : 0;

    if (custom && value > 0) {
      const campaign = await writeClient.fetch(
        `*[_type == "campaign" && slug.current == $slug][0]._id`,
        { slug: custom },
      );

      if (campaign) {
        const transaction = writeClient.transaction();
        transaction.patch(campaign, (p: { inc: (args: { raised: number }) => void }) => p.inc({ raised: value }));
        await transaction.commit();
        console.log(`PayPal IPN → campaign "${custom}" updated: +${value}€`);
      }
    }
  } catch (err) {
    console.error("PayPal IPN error:", err);
    return new Response("Server Error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
};

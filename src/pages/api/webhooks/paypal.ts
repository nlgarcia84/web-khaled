import type { APIRoute } from "astro";

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
    const txnType = params.get("txn_type");
    const amount = params.get("mc_gross");
    const currency = params.get("mc_currency");
    const payerEmail = params.get("payer_email");
    const txnId = params.get("txn_id");
    const receiverEmail = params.get("receiver_email");

    if (paymentStatus !== "Completed") {
      console.log(`PayPal IPN: payment status "${paymentStatus}", skipping`);
      return new Response("OK", { status: 200 });
    }

    console.log(`
========== PayPal Donation ==========
Amount: ${amount} ${currency}
Payer:  ${payerEmail}
Txn ID: ${txnId}
Recipient: ${receiverEmail}
Type:   ${txnType}
=====================================`);

  } catch (err) {
    console.error("PayPal IPN error:", err);
    return new Response("Server Error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
};

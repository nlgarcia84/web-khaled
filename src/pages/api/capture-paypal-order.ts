import type { APIRoute } from "astro";
import { capturePayPalOrder } from "../../lib/paypal";
import { writeClient } from "../../lib/sanity";

/**
 * Captura una orden de PayPal aprobada y actualiza Sanity.
 *
 * @route   POST /api/capture-paypal-order
 * @param   {string} orderID        - ID de la orden de PayPal
 * @param   {string} [campaignSlug] - Slug de campaña a actualizar
 * @returns {object} { ok: true }
 *
 * Se llama desde el frontend después de que el usuario aprueba el pago en el popup.
 * Si la captura es exitosa y hay campaignSlug, incrementa `raised` en Sanity.
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderID, campaignSlug } = await request.json();

    if (!orderID) {
      return new Response(JSON.stringify({ error: "Falta orderID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const captureData = await capturePayPalOrder(orderID);

    const purchaseUnits = captureData.purchase_units as Array<Record<string, unknown>> | undefined;
    const payments = purchaseUnits?.[0]?.payments as Record<string, unknown> | undefined;
    const captures = payments?.captures as Array<Record<string, unknown>> | undefined;
    const capture = captures?.[0];
    const status = capture?.status as string;
    const amount = capture?.amount as { value: string } | undefined;

    if (status !== "COMPLETED") {
      return new Response(JSON.stringify({ error: "Pago no completado" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const value = amount ? parseFloat(amount.value) : 0;

    if (campaignSlug && value > 0) {
      const campaign = await writeClient.fetch(
        `*[_type == "campaign" && slug.current == $slug][0]._id`,
        { slug: campaignSlug },
      );

      if (campaign) {
        const transaction = writeClient.transaction();
        transaction.patch(campaign, (p: { inc: (args: { raised: number }) => void }) => p.inc({ raised: value }));
        await transaction.commit();
        console.log(`PayPal donation registered: ${value}€ → "${campaignSlug}"`);
      }
    } else if (value > 0) {
      console.log(`PayPal general donation: ${value}€`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error capturing PayPal order:", err);
    return new Response(JSON.stringify({ error: "Error al capturar el pago" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

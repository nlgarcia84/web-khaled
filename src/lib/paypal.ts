const PAYPAL_API = "https://api-m.paypal.com";
const CLIENT_ID = import.meta.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.PAYPAL_CLIENT_SECRET;

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(amount: number, campaignSlug?: string) {
  const token = await getAccessToken();

  const body: Record<string, unknown> = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "EUR",
          value: amount.toFixed(2),
        },
        ...(campaignSlug ? { custom_id: campaignSlug } : {}),
      },
    ],
  };

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as { id: string; status: string };
  return data;
}

export async function capturePayPalOrder(orderID: string) {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json() as Record<string, unknown>;
}

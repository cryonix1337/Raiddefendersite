const Stripe = require("stripe");

const plans = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  quarterly: process.env.STRIPE_PRICE_QUARTERLY,
  yearly: process.env.STRIPE_PRICE_YEARLY
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  const { plan, discordId } = JSON.parse(event.body || "{}");
  if (!plans[plan] || !/^\d{17,20}$/.test(String(discordId || ""))) {
    return { statusCode: 400, body: JSON.stringify({ error: "Offre ou identifiant Discord invalide." }) };
  }
  if (!process.env.STRIPE_SECRET_KEY || !process.env.APP_URL) {
    return { statusCode: 503, body: JSON.stringify({ error: "Paiement Stripe non configuré." }) };
  }
  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plans[plan], quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      client_reference_id: String(discordId),
      metadata: { discord_id: String(discordId), plan },
      subscription_data: { metadata: { discord_id: String(discordId), plan } },
      success_url: `${process.env.APP_URL}/site/pages/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/site/pages/premium.html?cancelled=1`
    });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: "Impossible de créer la session de paiement." }) };
  }
};

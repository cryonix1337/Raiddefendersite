const Stripe = require("stripe");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const payload = Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");
    const stripeEvent = stripe.webhooks.constructEvent(payload, event.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
    if (stripeEvent.type === "checkout.session.completed" && process.env.DISCORD_PAYMENT_WEBHOOK_URL) {
      const session = stripeEvent.data.object;
      await fetch(process.env.DISCORD_PAYMENT_WEBHOOK_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ content:`🛒 **Nouvel abonnement Premium**\nID Discord : **${session.metadata?.discord_id}**` }) });
    }
    console.log(`Stripe: ${stripeEvent.type}`);
    return { statusCode: 200, body: "ok" };
  } catch (error) {
    console.error(error.message);
    return { statusCode: 400, body: "Webhook invalide" };
  }
};

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const sig = event.headers["stripe-signature"];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return { statusCode: 400, body: "Webhook signature verification failed" };
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const userId = session.client_reference_id;
    if (userId) {
      await supabase
        .from("profiles")
        .update({
          is_paid: true,
          stripe_customer_id: session.customer,
          stripe_session_id: session.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }
  }

  return { statusCode: 200, body: "ok" };
};

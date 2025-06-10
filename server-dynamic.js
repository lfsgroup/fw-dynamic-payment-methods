require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.static("public_dpm"));
app.use(express.json());

// Serve publishable key to frontend
app.get("/config", (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});
// Create Payment Intent with automatic payment methods
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "usd" } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency,
      // Let Stripe automatically determine available payment methods
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "always",
      },
      metadata: {
        order_id: "order_123",
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(400).send({
      error: {
        message: error.message,
      },
    });
  }
});

const PORT = process.env.DYNAMIC_PM_PORT || 4001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

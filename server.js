require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.static("public"));
app.use(express.json());

// Serve publishable key to frontend
app.get("/config", (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// Create Payment Intent endpoint
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "usd" } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method_types: ["card", "us_bank_account", "affirm"],
      // automatic_payment_methods: {
      //   enabled: true,
      //   allow_redirects: 'always'
      // },
      // payment_method_configuration: process.env.STRIPE_BNPL_CONFIG,
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

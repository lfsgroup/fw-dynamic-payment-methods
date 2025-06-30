import { config } from "dotenv";
import express from "express";
import stripeApi from "stripe";
import PaymentMethodController from "./pm-controller.js";
config();
const stripe = stripeApi(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.static("public_dpm"));
app.use(express.json());

// Serve publishable key to frontend
app.get("/config", (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    pmc: process.env.PAYMENT_METHOD_CONFIGURATION_ID,
  });
});
// Create Payment Intent with automatic payment methods
app.post("/create-payment-intent", async (req, res) => {
  try {
    const {
      amount,
      currency = "usd",
      country = "US",
      customer_segment = "default",
    } = req.body;

    // Get custome payment method configuration based on config id
    const pmConfiguration = await stripe.paymentMethodConfigurations.retrieve(
      process.env.PAYMENT_METHOD_CONFIGURATION_ID,
    );

    // Extract payment method names
    const paymentMethods = Object.keys(pmConfiguration).filter(
      (key) =>
        pmConfiguration[key] &&
        pmConfiguration[key].display_preference &&
        pmConfiguration[key].display_preference.preference === "on",
    );

    const pmController = new PaymentMethodController(paymentMethods);

    // Get filtered payment methods
    const allowedMethods = pmController.filterPaymentMethods(
      amount,
      currency,
      country,
      customer_segment,
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency,
      // provide filtered payment method with amount limit filter applied
      payment_method_types: allowedMethods,

      // Let Stripe automatically determine available payment methods
      // payment_method_configuration: process.env.PAYMENT_METHOD_CONFIGURATION_ID,
      // automatic_payment_methods: {
      //   enabled: true,
      //   allow_redirects: "always",
      // },
      metadata: {
        order_id: `order_${Date.now()}`,
        created_at: new Date().toISOString(),
      },
    });
    console.log(paymentIntent);
    res.send({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });
    // res.send({
    //
    //   clientSecret: paymentIntent.client_secret,
    // });
  } catch (error) {
    res.status(400).send({
      error: {
        message: error.message,
      },
    });
  }
});

app.post("/create-static-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "usd" } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method_types: ["card", "us_bank_account", "affirm", "klarna"],
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

app.post("/create-setup-intent", async (req, res) => {
  try {
    const setupIntent = await stripe.setupIntents.create({
      // customer: "cus_customer_id" + Date.now(), // Optional: attach to existing customer
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "always",
      },
      usage: "off_session", // or 'on_session'
      // Optional: metadata for your reference
      metadata: {
        user_id: "user_123",
      },
    });
    console.log("SETUPINTENT--------------------------------------------");
    console.log({ setupIntent });
    res.send({
      client_secret: setupIntent.client_secret,
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

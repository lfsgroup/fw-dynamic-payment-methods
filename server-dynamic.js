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
      currency,
      country = "US",
      customer_segment = "default",
      products = [],
    } = req.body;

    // // Get custome payment method configuration based on config id
    // const pmConfiguration = await stripe.paymentMethodConfigurations.retrieve(
    //   process.env.PAYMENT_METHOD_CONFIGURATION_ID,
    // );
    //
    // // Extract payment method names
    // const paymentMethods = Object.keys(pmConfiguration).filter(
    //   (key) =>
    //     pmConfiguration[key] &&
    //     pmConfiguration[key].display_preference &&
    //     pmConfiguration[key].display_preference.preference === "on",
    // );
    //
    // const pmController = new PaymentMethodController(paymentMethods);
    //
    // // Get filtered payment methods
    // const allowedMethods = pmController.filterPaymentMethods(
    //   amount,
    //   currency,
    //   country,
    //   customer_segment,
    // );
    //
    console.log("Product receive4d:---------------------", products);
    const paymentIntentOptions = {
      metadata: {
        order_id: `order_${Date.now()}`,
        created_at: new Date().toISOString(),
      },
      payment_method_types: products,
    };
    if (products.includes("acss_debit")) {
      paymentIntentOptions.payment_method_options = {
        acss_debit: {
          mandate_options: {
            payment_schedule: "sporadic", // or 'interval'
            transaction_type: "personal", // or 'business'
            // Optional: Add interval details if payment_schedule is 'interval'
            // interval_description: "Monthly subscription payment",
          },
        },
      };
    }

    if (currency) {
      paymentIntentOptions.currency = currency;
    }
    if (amount) {
      paymentIntentOptions.amount = amount;
    }
    const paymentIntent = await stripe.paymentIntents.create({
      ...paymentIntentOptions,
      // provide filtered payment method with amount limit filter applied

      // Let Stripe automatically determine available payment methods
      // payment_method_configuration: process.env.PAYMENT_METHOD_CONFIGURATION_ID,
      // automatic_payment_methods: {
      //   enabled: true,
      //   allow_redirects: "always",
      // },
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

// app.post("/create-setup-intent", async (req, res) => {
//   try {
//     const setupIntent = await stripe.setupIntents.create({
//       // customer: "cus_customer_id" + Date.now(), // Optional: attach to existing customer
//       automatic_payment_methods: {
//         enabled: true,
//         allow_redirects: "always",
//       },
//       usage: "off_session", // or 'on_session'
//       // Optional: metadata for your reference
//       metadata: {
//         user_id: "user_123",
//       },
//     });
//     console.log("SETUPINTENT--------------------------------------------");
//     console.log({ setupIntent });
//     res.send({
//       client_secret: setupIntent.client_secret,
//     });
//   } catch (error) {
//     res.status(400).send({
//       error: {
//         message: error.message,
//       },
//     });
//   }
// });
app.post("/create-setup-intent", async (req, res) => {
  try {
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ["acss_debit"],
      payment_method_options: {
        acss_debit: {
          currency: "cad",
          mandate_options: {
            payment_schedule: "combined",
            transaction_type: "personal",
            interval_description: "Setup fee and recurring monthly charges", // Required!
          },
        },
      },
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/create-payment-with-token", async (req, res) => {
  try {
    const { paymentMethodId, amount, confirmationTokenId } = req.body;

    // Create a confirmation token
    // const token = await stripe.confirmationTokens.create({
    //   payment_method: paymentMethodId,
    // });

    // Create and confirm a PaymentIntent with the token
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "cad",
      payment_method_types: ["acss_debit"],
      payment_method: paymentMethodId,
      confirmation_token: confirmationTokenId,
      confirm: true,
    });

    if (paymentIntent.status === "requires_action") {
      res.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
      });
    } else {
      res.json({ paymentIntent });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get("/products", async (req, res) => {
  try {
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
    const amountRangeRule = {
      klarna: { min: 10000, max: 1000000 }, // $105 - $10,000
      afterpay_clearpay: { min: 100, max: 200000 }, // $1 - $2,000
      affirm: { min: 15000, max: 3000000 }, // $150 - $30,000
      zip: { min: 100, max: 100000 }, // $1 - $1,000
      paypal: { min: 100, max: 6000000 }, // $1 - $60,000
      card: { min: 50, max: 99999999 }, // $0.50+
      us_bank_account: { min: 100, max: null }, // $1+
      sepa_debit: { min: 50, max: null }, // €0.50+
      acss_debit: { min: 50, max: null }, // CAD $0.50+
    };
    res.send({
      products: paymentMethods,
      amountRangeRule,
    });
  } catch (error) {
    res.status(400).send({
      error: {
        message: error.message,
      },
    });
  }
});

// Node.js/Express example
app.post("/process-payment", async (req, res) => {
  const {
    confirmation_token,
    amount,
    return_url,
    currency = "usd",
    payment_method_types = [],
  } = req.body;

  try {
    const paymentIntentOptions = {
      amount: amount,
      currency,
      confirmation_token: confirmation_token,
      confirm: true, // Immediately attempt to confirm
      payment_method_types,
      return_url,
    };

    if (currency === "cad") {
      // delete paymentIntentOptions.confirm;
      Object.assign(paymentIntentOptions, {
        payment_method_options: {
          acss_debit: {
            mandate_options: {
              payment_schedule: "sporadic", // or 'interval'
              transaction_type: "personal", // or 'business'
              // Optional: Add interval details if payment_schedule is 'interval'
              interval_description: "Monthly subscription payment",
            },
          },
        },
        confirmation_method: "automatic",
      });
    }

    // Create PaymentIntent with confirmation token
    const paymentIntent =
      await stripe.paymentIntents.create(paymentIntentOptions);

    res.json({
      success: true,
      payment_intent: paymentIntent,
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment failed:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

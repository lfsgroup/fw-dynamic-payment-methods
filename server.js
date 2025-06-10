require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.static('public'));
app.use(express.json());

// Serve publishable key to frontend
app.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

// Create Payment Intent endpoint
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'aud', paymentMethods} = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always'
      },
      //payment_method_types: ['card', 'klarna'],
      payment_method_configuration: paymentMethods,
      metadata: {
        order_id: 'order_123',
        payment_config: paymentMethods
      }
    });

    res.send({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(400).send({
      error: {
        message: error.message
      }
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require('express');
const dotenv = require('dotenv');
const stripe = require('stripe');
const cors = require('cors');

// Load variables
dotenv.config();

// Start Server
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Stripe , using .env file for the stripe_api key. Change later to environmental
let stripe_secret_key = process.env.stripe_api
let stripeGateway = stripe(stripe_secret_key);
// In .env file, needs changed when hosted
let DOMAIN = process.env.DOMAIN;

app.post('/stripe-checkout', cors(), async (req, res) => {
    try {
        const lineItems = req.body.items.map((item) => {
            const priceString = String(item.price);
            const unitAmount = parseInt(priceString.replace(/[^0-9.-]+/g, '') * 100);
            return {
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: item.title,
                        images: [item.image],
                    },
                    unit_amount: unitAmount,
                },
                quantity: item.quantity,
            };
        });
        // Create Checkout Session
        const session = await stripeGateway.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${DOMAIN}/the-smile-react/success?success=true`,
            cancel_url: `${DOMAIN}/the-smile-react/cancel`,
            line_items: lineItems,
            // Asking address In Stripe Checkout Page
            billing_address_collection: 'required'
        });
        console.log('session:', session);
        res.json({ success: true, sessionId: session.id, checkoutUrl: session.url });
    }   catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: 'Internal Server Error'});
    }
});

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
});
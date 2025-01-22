const env = require("dotenv");
env.config({ path: "./.env" });


const Stripe = require("stripe");

const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";



exports.createPaymentIntent = async (req, res) => {
    const { email, amount } = req.body;

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2023-08-16",
    });

    // Get the customer using the email
    let customers = await stripe.customers.list({ email: email });

    // Create a new customer if none exists
    let customer = customers.data[0];
    if (!customer) {
        customer = await stripe.customers.create({
            email: email,
        });
    }

    // Generate ephemeral key and payment intent
    const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: "2023-08-16" }
    );
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "eur",
        customer: customer.id,
        payment_method_types: ["card"],
    });

    return res.json({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
    });
}


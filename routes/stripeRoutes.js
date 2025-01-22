const express = require("express");
const router = express.Router();

const {
    createPaymentIntent
} = require("../controllers/stripeController");


router.post("/payment-sheet", (req, res) => createPaymentIntent(req, res));


module.exports = router;
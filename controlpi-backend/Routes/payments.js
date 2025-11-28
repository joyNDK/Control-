const express = require("express");
const router = express.Router();

// Confirmation de paiement
router.post("/confirm", async (req, res) => {
  const { paymentId } = req.body || {};
  if (!paymentId) return res.status(400).json({ error: "PaymentId manquant" });

  // Vérification côté Pi Developer API
  // const payment = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
  //   headers: { Authorization: `Bearer ${process.env.PI_API_KEY}` }
  // });
  // const data = await payment.json();

  // Exemple simplifié : on suppose que le paiement est validé
  res.json({ ok: true, paymentId, status: "completed" });
});

module.exports = router;
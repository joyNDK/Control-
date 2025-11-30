import express from "express";
const router = express.Router();

// Création d'un paiement
router.post("/", (req, res) => {
  const payment = req.body;
  console.log("Paiement reçu :", payment);

  // Ici tu peux stocker le paiement en base ou vérifier
  res.json({ status: "pending", payment });
});

export default router;
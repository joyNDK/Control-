import express from "express";
const router = express.Router();

// Exemple de route d'authentification
router.post("/", (req, res) => {
  const { accessToken } = req.body;
  console.log("Token reçu :", accessToken);

  // Ici tu valides le token avec l'API Pi
  // Pour l'instant on simule une réponse OK
  res.json({ status: "ok", user: { username: "TestUser" } });
});

export default router;
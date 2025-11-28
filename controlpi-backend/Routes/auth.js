const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/pi-login", async (req, res) => {
  const { authResult } = req.body || {};
  if (!authResult || !authResult.user) {
    return res.status(400).json({ error: "Résultat d’authentification invalide" });
  }

  // Vérification côté Pi Developer API (exemple simplifié)
  // const verify = await fetch("https://api.minepi.com/v2/verify", {
  //   headers: { Authorization: `Bearer ${process.env.PI_API_KEY}` }
  // });

  const payload = {
    uid: authResult.user.uid,
    username: authResult.user.username
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

  res.json({ token, user: payload });
});

module.exports = router;
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Validation Pi
app.get("/validation-key.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "validation-key.txt"));
});

// Test
app.get("/", (req, res) => {
  res.send("✅ ControlPi Backend en ligne !");
});

// Paiement
app.post("/api/payments/create", (req, res) => {
  console.log("Paiement créé :", req.body);
  res.json({ success: true, status: "pending" });
});

app.post("/api/payments/approve", (req, res) => {
  console.log("Paiement approuvé :", req.body.paymentId);
  res.json({ success: true, message: "Paiement approuvé" });
});

app.post("/api/payments/callback", (req, res) => {
  console.log("Paiement validé :", req.body.paymentId, req.body.txid);
  res.json({ success: true, message: "Paiement validé" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend sur port ${PORT}`));
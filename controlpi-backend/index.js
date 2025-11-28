// Import des modules
const express = require("express");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const PDFDocument = require("pdfkit");

// Initialisation
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());

// --- Middleware JWT ---
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Token manquant" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token invalide" });
  }
}

// --- Traductions ---
const translations = {
  fr: {
    anomaly: (threshold) => `Montant inhabituel détecté (≥ ${threshold} Pi)`,
    thresholdSaved: (val) => `Seuil enregistré avec succès : ${val} Pi`,
    pdfTitle: "Rapport des transactions Pi",
    columns: ["ID", "Date", "Montant (Pi)", "Statut", "Contrepartie"]
  },
  en: {
    anomaly: (threshold) => `Unusual amount detected (≥ ${threshold} Pi)`,
    thresholdSaved: (val) => `Threshold saved successfully: ${val} Pi`,
    pdfTitle: "Pi Transactions Report",
    columns: ["ID", "Date", "Amount (Pi)", "Status", "Counterparty"]
  },
  zh: {
    anomaly: (threshold) => `检测到异常金额 (≥ ${threshold} Pi)`,
    thresholdSaved: (val) => `阈值已成功保存：${val} Pi`,
    pdfTitle: "Pi 交易报告",
    columns: ["编号", "日期", "金额 (Pi)", "状态", "交易方"]
  }
};

// --- Paramètres utilisateur ---
let userSettings = { alert_threshold_pi: 10 };

// --- Exemple route simple ---
app.get("/", (req, res) => {
  res.send("✅ Backend ControlPi fonctionne");
});

// --- Auth Pi ---
app.post("/api/auth/pi-login", (req, res) => {
  const { authResult } = req.body || {};
  if (!authResult || !authResult.user) {
    return res.status(400).json({ error: "Résultat d’authentification invalide" });
  }
  const payload = { uid: authResult.user.uid, username: authResult.user.username };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token, user: payload });
});

// --- Autres routes (transactions, export CSV/PDF, etc.) ---
// ⚠️ Tu gardes ton code existant ici, mais toujours après la création de `app`

// --- Lancement du serveur ---
app.listen(PORT, () => {
  console.log(`✅ Backend ControlPi running on http://localhost:${PORT}`);
});
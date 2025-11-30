import React, { useState } from "react";

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // 🔹 Authentification Pi
  const handleLogin = async () => {
    try {
      const scopes = ["username", "payments"];
      const authResult = await window.Pi.authenticate(scopes);

      // Envoi du token au backend
      const response = await fetch("https://pi-backend.onrender.com/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: authResult.accessToken }),
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        setError(null);
      } else {
        setError("Échec de l'authentification côté backend");
      }
    } catch (err) {
      console.error("Erreur Pi SDK :", err);
      setError("Échec de l'authentification Pi");
    }
  };

  // 🔹 Paiement Pi
  const handlePayment = async () => {
    try {
      // Création du paiement via SDK
      const payment = await window.Pi.createPayment({
        amount: 1,
        memo: "Test ControlPi",
        metadata: { purpose: "validation" },
      });

      // Envoi du paiement au backend
      const response = await fetch(
        "https://pi-backend.onrender.com/api/payments/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payment),
        }
      );

      const data = await response.json();
      if (data.success) {
        setPaymentStatus("Paiement en attente de confirmation...");
      } else {
        setPaymentStatus("Erreur lors de la création du paiement");
      }
    } catch (err) {
      console.error("Erreur paiement :", err);
      setPaymentStatus("⚠️ Échec du paiement");
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>✅ ControlPi Frontend fonctionne !</h1>
      <p>Bienvenue dans ton app React connectée au backend Render.</p>

      {!user ? (
        <button
          onClick={handleLogin}
          style={{
            marginTop: "1rem",
            padding: "0.8rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: "#f7931a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Se connecter avec Pi
        </button>
      ) : (
        <div style={{ marginTop: "1.5rem" }}>
          <h2>👋 Bonjour {user.username}</h2>
          <button
            onClick={handlePayment}
            style={{
              marginTop: "1rem",
              padding: "0.8rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Tester un paiement Pi
          </button>
        </div>
      )}

      {error && (
        <p style={{ color: "red", marginTop: "1rem" }}>
          ⚠️ {error}
        </p>
      )}

      {paymentStatus && (
        <p style={{ marginTop: "1rem", color: "blue" }}>{paymentStatus}</p>
      )}
    </div>
  );
}

export default App;
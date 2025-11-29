import React from "react";

function App() {
  const handlePayment = () => {
    if (!window.Pi) {
      alert("Pi SDK non chargé !");
      return;
    }

    window.Pi.createPayment(
      {
        amount: 0.001, // Montant en Pi
        memo: "Test transaction ControlPi",
        metadata: { userId: "nathan" }
      },
      {
        onReadyForServerApproval: async (paymentId) => {
          console.log("Demande d'approbation serveur:", paymentId);
          // Envoie au backend Render pour approbation
          await fetch("https://controlpi-backend.onrender.com/api/payments/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId })
          });
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log("Transaction prête à être complétée:", paymentId, txid);
          // Envoie au backend Render pour finalisation
          await fetch("https://controlpi-backend.onrender.com/api/payments/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid })
          });
        },
        onCancel: (paymentId) => {
          console.log("Paiement annulé:", paymentId);
        },
        onError: (error, paymentId) => {
          console.error("Erreur paiement:", error, paymentId);
        }
      }
    );
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>💻 ControlPi Frontend</h1>
      <p>Bienvenue, tu peux tester un paiement Pi ci‑dessous :</p>
      <button
        onClick={handlePayment}
        style={{
          padding: "1rem 2rem",
          fontSize: "1.2rem",
          backgroundColor: "#f5a623",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          color: "#fff"
        }}
      >
        💸 Payer avec Pi
      </button>
    </div>
  );
}

export default App;
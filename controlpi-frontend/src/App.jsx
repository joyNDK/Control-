import React from "react";

function App() {
  const handlePayment = () => {
    if (!window.Pi) {
      alert("Pi SDK non chargé !");
      return;
    }

    window.Pi.createPayment(
      {
        amount: 0.001,
        memo: "Test transaction ControlPi",
        metadata: { userId: "nathan" }
      },
      {
        onReadyForServerApproval: async (paymentId) => {
          await fetch("https://controlpi-backend.onrender.com/api/payments/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId })
          });
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
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
      <h1>ControlPi Frontend</h1>
      <button onClick={handlePayment}>💸 Payer avec Pi</button>
    </div>
  );
}

export default App;
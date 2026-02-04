import React, { useState, useEffect } from 'react';
import './App.css';

// ⚡ IMPORTANT : NOUVELLE URL BACKEND SUR CODE SANDBOX ⚡
const BACKEND_URL = 'https://svzsgd-3000.csb.app';
// Ancienne URL: 'https://controlpi-backend.onrender.com'

function App() {
  const [status, setStatus] = useState('Initialisation...');
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [user, setUser] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const [backendReady, setBackendReady] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [logEntry, ...prev].slice(0, 10));
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Vérifier si on est dans Pi Browser
  useEffect(() => {
    const checkPiBrowser = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isPi = /PiBrowser/i.test(userAgent);
      setIsPiBrowser(isPi);
      addLog(`Navigateur: ${isPi ? 'Pi Browser ✅' : 'Autre navigateur'}`);
    };

    checkPiBrowser();
    testBackendConnection();
  }, []);

  // Charger le SDK Pi
  useEffect(() => {
    const loadPiSDK = () => {
      if (window.Pi) {
        addLog('SDK Pi déjà chargé');
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.minepi.com/pi-sdk.js';
      script.async = true;
      script.onload = () => {
        if (window.Pi) {
          window.Pi.init({ 
            version: "2.0",
            sandbox: process.env.NODE_ENV !== 'production'
          });
          addLog('SDK Pi chargé et initialisé ✅');
        } else {
          addLog('SDK Pi non disponible après chargement', 'error');
        }
      };
      script.onerror = () => {
        addLog('Erreur chargement SDK Pi', 'error');
      };
      document.head.appendChild(script);
    };

    loadPiSDK();
  }, []);

  // Tester la connexion backend
  const testBackendConnection = async () => {
    setStatus('Test connexion backend...');
    addLog('Test connexion backend en cours');
    
    try {
      const response = await fetch(BACKEND_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'online' || data.success || data.service) {
        setStatus(`✅ Backend connecté: ${data.service || 'CodeSandbox'}`);
        setBackendReady(true);
        addLog(`Backend: ${data.service || 'API'} - ${data.message || 'Opérationnel'}`);
        addLog(`URL: ${BACKEND_URL}`);
        
        // Tester les endpoints spécifiques
        testAllEndpoints();
      } else {
        setStatus('⚠️ Backend répond mais format inattendu');
        addLog('Réponse backend inattendue', 'warning');
        console.log('Réponse:', data);
      }
    } catch (error) {
      setStatus(`❌ Impossible de joindre le backend: ${error.message}`);
      addLog(`Erreur connexion: ${error.message}`, 'error');
      setBackendReady(false);
    }
  };

  // Tester tous les endpoints
  const testAllEndpoints = async () => {
    const endpoints = [
      { path: '/health', method: 'GET', name: 'Health Check' },
      { path: '/test', method: 'GET', name: 'Test Route' },
      { path: '/pi-test', method: 'GET', name: 'Pi Test' },
      { path: '/pi-validate', method: 'GET', name: 'Pi Validation' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BACKEND_URL}${endpoint.path}`, {
          method: endpoint.method
        });
        const data = await response.json();
        addLog(`${endpoint.name}: ${response.ok ? '✅' : '❌'} ${response.status}`);
      } catch (error) {
        addLog(`${endpoint.name}: ❌ ${error.message}`, 'warning');
      }
    }
  };

  // Authentification
  const handleAuth = async () => {
    if (!backendReady) {
      setPaymentStatus('❌ Backend non disponible');
      addLog('Backend non prêt pour authentification', 'error');
      return;
    }

    addLog('Démarrage authentification');
    setPaymentStatus('Authentification en cours...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: `user_${Date.now()}`,
          username: 'controlpi_user'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setPaymentStatus('✅ Authentifié avec succès');
        addLog(`Utilisateur: ${data.user.username} (${data.user.uid})`);
        addLog(`Session: ${data.user.session || 'N/A'}`);
      } else {
        setPaymentStatus(`❌ Erreur: ${data.error || 'Inconnue'}`);
        addLog(`Erreur auth: ${data.error}`, 'error');
      }
    } catch (error) {
      setPaymentStatus('❌ Erreur réseau');
      addLog(`Erreur réseau auth: ${error.message}`, 'error');
    }
  };

  // Créer un paiement
  const createPayment = async () => {
    if (!window.Pi) {
      setPaymentStatus('❌ SDK Pi non disponible');
      addLog('SDK Pi non disponible pour paiement', 'error');
      return;
    }

    if (!backendReady) {
      setPaymentStatus('❌ Backend non disponible');
      addLog('Backend non prêt pour paiement', 'error');
      return;
    }

    addLog('Création paiement démarrée');
    setPaymentStatus('Création paiement...');

    try {
      // 1. Créer le paiement sur notre backend
      const response = await fetch(`${BACKEND_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          amount: 3.14,
          memo: 'Test ControlPi - CodeSandbox Backend',
          product: 'Validation Pi Developer Portal'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur création paiement');
      }

      addLog(`Paiement créé: ${data.payment.identifier}`);
      addLog(`Montant: ${data.payment.amount} π`);
      addLog(`Mémo: ${data.payment.memo}`);
      setPaymentStatus('Paiement créé, lancement flux Pi...');

      // 2. Configuration des callbacks SDK Pi
      const onReadyForServerApproval = async (paymentId) => {
        addLog(`SDK prêt pour approbation: ${paymentId}`);
        setPaymentStatus('Approbation serveur en cours...');

        try {
          const approveResponse = await fetch(`${BACKEND_URL}/api/payments/approve`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ paymentId })
          });

          if (!approveResponse.ok) {
            throw new Error(`HTTP ${approveResponse.status}`);
          }

          const approveData = await approveResponse.json();
          
          if (approveData.success) {
            addLog(`Paiement approuvé: ${approveData.txid}`);
            setPaymentStatus('✅ Paiement approuvé !');
            
            // Compléter le paiement avec le SDK Pi
            window.Pi.completePayment(paymentId, approveData.txid);
            
            // Envoyer la complétion à notre backend
            await fetch(`${BACKEND_URL}/api/payments/complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId,
                txid: approveData.txid
              })
            });
            
            addLog('Paiement complété côté backend');
            
            // Appeler le callback
            await fetch(`${BACKEND_URL}/api/payments/callback`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId,
                txid: approveData.txid,
                status: 'completed',
                amount: data.payment.amount,
                memo: data.payment.memo
              })
            });
            
            addLog('Callback Pi envoyé');
            
          } else {
            throw new Error(approveData.error || 'Erreur approbation');
          }
        } catch (error) {
          addLog(`Erreur approbation: ${error.message}`, 'error');
          setPaymentStatus('❌ Erreur approbation');
        }
      };

      const onCancel = (paymentId, payment) => {
        addLog(`Paiement annulé: ${paymentId}`);
        setPaymentStatus('❌ Paiement annulé par l\'utilisateur');
        
        // Notifier le backend
        fetch(`${BACKEND_URL}/api/payments/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId,
            status: 'cancelled',
            reason: 'user_cancelled'
          })
        });
      };

      const onError = (error, payment) => {
        addLog(`Erreur SDK Pi: ${error.message}`, 'error');
        setPaymentStatus('❌ Erreur SDK Pi');
        
        // Notifier le backend
        fetch(`${BACKEND_URL}/api/payments/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: payment.identifier,
            status: 'error',
            error: error.message
          })
        });
      };

      // 3. Lancer le paiement avec le SDK Pi
      const payment = data.payment;
      addLog('Lancement du flux Pi SDK...');
      
      window.Pi.createPayment(payment, {
        onReadyForServerApproval,
        onCancel,
        onError
      });

      addLog('Flux SDK Pi lancé avec succès');

    } catch (error) {
      addLog(`Erreur création paiement: ${error.message}`, 'error');
      setPaymentStatus(`❌ Erreur: ${error.message}`);
    }
  };

  // Test complet
  const runCompleteTest = async () => {
    addLog('=== DÉBUT TEST COMPLET ===');
    setPaymentStatus('Test complet démarré...');
    
    await testBackendConnection();
    if (backendReady) {
      await handleAuth();
      await createPayment();
    } else {
      addLog('Test arrêté: backend non disponible', 'error');
      setPaymentStatus('❌ Backend non disponible');
    }
    
    addLog('=== FIN TEST COMPLET ===');
  };

  // Voir tous les paiements (debug)
  const viewAllPayments = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/all`);
      const data = await response.json();
      if (data.success) {
        addLog(`Paiements: ${data.count || data.payments?.length || 0} trouvés`);
        console.log('Tous les paiements:', data);
      } else {
        addLog('Endpoint /all non disponible', 'info');
      }
    } catch (error) {
      addLog(`Endpoint /all: ${error.message}`, 'info');
    }
  };

  // Tester directement l'endpoint de création
  const testCreateDirect = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1 })
      });
      const data = await response.json();
      console.log('Direct create response:', data);
      addLog(`Test direct: ${data.success ? '✅' : '❌'} ${data.error || ''}`);
    } catch (error) {
      addLog(`Test direct échoué: ${error.message}`, 'error');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎛️ ControlPi v2.0</h1>
        <p className="subtitle">Backend sur CodeSandbox - Pi Network Ready</p>
        <div className="url-display">
          <strong>Backend URL:</strong> 
          <code>{BACKEND_URL}</code>
          <span className={backendReady ? 'status-badge success' : 'status-badge error'}>
            {backendReady ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
          </span>
        </div>
      </header>

      <main className="main">
        {/* Section Statut */}
        <section className="card status-card">
          <h2>📡 Statut du Système</h2>
          <div className="status-content">
            <div className="status-item">
              <strong>Connexion Backend:</strong>
              <span className={status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : 'warning'}>
                {status}
              </span>
            </div>
            <div className="status-item">
              <strong>Navigateur:</strong>
              <span className={isPiBrowser ? 'success' : 'warning'}>
                {isPiBrowser ? 'Pi Browser ✅' : 'Autre navigateur ⚠️'}
              </span>
            </div>
            <div className="status-item">
              <strong>SDK Pi:</strong>
              <span className={window.Pi ? 'success' : 'warning'}>
                {window.Pi ? 'Chargé ✅' : 'Chargement...'}
              </span>
            </div>
            <div className="status-item">
              <strong>Utilisateur:</strong>
              <span>{user ? `${user.username} (${user.uid})` : 'Non authentifié'}</span>
            </div>
            <div className="status-item">
              <strong>Backend Prêt:</strong>
              <span className={backendReady ? 'success' : 'error'}>
                {backendReady ? '✅ Oui' : '❌ Non'}
              </span>
            </div>
          </div>
        </section>

        {/* Section Paiement */}
        <section className="card payment-card">
          <h2>💰 Test de Paiement Pi Network</h2>
          <div className="payment-status">
            <strong>Statut paiement:</strong>
            <div className="payment-message">{paymentStatus || 'Prêt pour transaction...'}</div>
          </div>
          
          <div className="buttons">
            <button 
              onClick={testBackendConnection} 
              className="btn btn-primary"
              disabled={!backendReady}
            >
              🔄 Tester Backend
            </button>
            <button 
              onClick={handleAuth} 
              className="btn btn-secondary"
              disabled={!backendReady}
            >
              🔐 Authentification Pi
            </button>
            <button 
              onClick={createPayment} 
              className="btn btn-success"
              disabled={!backendReady || !window.Pi}
            >
              💰 Tester Paiement (3.14 π)
            </button>
            <button 
              onClick={runCompleteTest} 
              className="btn btn-warning"
              disabled={!backendReady}
            >
              🧪 Test Complet Automatique
            </button>
            <button 
              onClick={testCreateDirect} 
              className="btn btn-info"
              disabled={!backendReady}
            >
              🔧 Test Création Directe
            </button>
            <button 
              onClick={viewAllPayments} 
              className="btn btn-dark"
              disabled={!backendReady}
            >
              📋 Debug Paiements
            </button>
          </div>

          <div className="instructions">
            <h3>📋 Instructions pour Pi Developer Portal:</h3>
            <ol>
              <li>Ouvre cette page dans <strong>Pi Browser</strong></li>
              <li>Clique sur <strong>"Tester Backend"</strong> - doit afficher ✅</li>
              <li>Clique sur <strong>"Authentification Pi"</strong></li>
              <li>Clique sur <strong>"Tester Paiement"</strong></li>
              <li>Complète la transaction dans <strong>Pi Wallet</strong></li>
              <li>Vérifie sur <strong>Pi Developer Portal</strong> que "Process a Transaction" est vert</li>
            </ol>
            <div className="important-note">
              <strong>⚡ IMPORTANT:</strong> 
              <ul>
                <li>Backend URL: <code>{BACKEND_URL}</code></li>
                <li>Frontend URL: <code>https://controlpi-frontend.vercel.app</code></li>
                <li>Callback URL: <code>{BACKEND_URL}/api/payments/callback</code></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section Logs */}
        <section className="card logs-card">
          <h2>📝 Logs en Temps Réel</h2>
          <div className="logs-container">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="log-entry">
                  {log}
                </div>
              ))
            ) : (
              <div className="no-logs">Aucun log pour le moment...</div>
            )}
          </div>
          <div className="logs-controls">
            <button 
              onClick={() => setLogs([])} 
              className="btn btn-small"
            >
              🗑️ Effacer les logs
            </button>
            <button 
              onClick={() => navigator.clipboard.writeText(logs.join('\n'))}
              className="btn btn-small"
            >
              📋 Copier les logs
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          <strong>ControlPi v2.0</strong> | 
          Backend: <code>{BACKEND_URL}</code> | 
          Frontend: <code>https://controlpi-frontend.vercel.app</code>
        </p>
        <p className="debug-info">
          Pour validation Pi Developer Portal: 
          1. Test complet dans Pi Browser → 
          2. Vérifier "Process a Transaction on the App" → 
          3. Si vert ✅, app validée!
        </p>
        <div className="footer-links">
          <a href={`${BACKEND_URL}/health`} target="_blank" rel="noopener noreferrer">
            🔗 Health Check
          </a>
          <a href={`${BACKEND_URL}/pi-test`} target="_blank" rel="noopener noreferrer">
            🔗 Pi Test
          </a>
          <a href={`${BACKEND_URL}/pi-validate`} target="_blank" rel="noopener noreferrer">
            🔗 Pi Validation
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
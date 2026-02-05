import React, { useState, useEffect } from 'react';
import './App.css';

// ⚡ CONFIGURATION - CODE SANDBOX BACKEND ⚡
const BACKEND_URL = 'https://svzsgd-3000.csb.app';
const FRONTEND_URL = 'https://controlpi-frontend.vercel.app';

function App() {
  // États
  const [status, setStatus] = useState('Initialisation...');
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [user, setUser] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [backendReady, setBackendReady] = useState(false);
  const [validationChecked, setValidationChecked] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [logs, setLogs] = useState([]);

  // Fonction de logging
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [logEntry, ...prev].slice(0, 20));
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Vérification navigateur
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

  // Chargement SDK Pi
  useEffect(() => {
    const loadPiSDK = () => {
      if (window.Pi) {
        addLog('SDK Pi déjà chargé');
        return;
      }

      addLog('Chargement du SDK Pi...');
      const script = document.createElement('script');
      script.src = 'https://sdk.minepi.com/pi-sdk.js';
      script.async = true;
      script.onload = () => {
        if (window.Pi) {
          window.Pi.init({ 
            version: "2.0",
            sandbox: process.env.NODE_ENV !== 'production'
          });
          addLog('✅ SDK Pi chargé et initialisé');
        } else {
          addLog('❌ SDK Pi non disponible après chargement', 'error');
        }
      };
      script.onerror = (error) => {
        addLog(`❌ Erreur chargement SDK Pi: ${error}`, 'error');
      };
      document.head.appendChild(script);
    };

    loadPiSDK();
  }, []);

  // Test connexion backend
  const testBackendConnection = async () => {
    setStatus('Test connexion backend...');
    addLog('Test connexion backend en cours');
    
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatus(`✅ Backend connecté: ${data.status}`);
      setBackendReady(true);
      addLog(`Backend: ${data.status} - ${data.platform}`);
      addLog(`URL: ${data.url}`);
      addLog(`Uptime: ${data.uptime}s`);
      
      // Test automatique validation
      testValidation();
      
    } catch (error) {
      setStatus(`❌ Erreur backend: ${error.message}`);
      addLog(`Erreur connexion: ${error.message}`, 'error');
      setBackendReady(false);
    }
  };

  // Test validation Pi Network
  const testValidation = async () => {
    try {
      addLog('Test validation Pi Network...');
      const response = await fetch(`${BACKEND_URL}/validate-diagnostic`);
      const data = await response.json();
      
      if (data.success) {
        setValidationChecked(true);
        setValidationResult(data.validation_test);
        addLog(`✅ Validation testé: ${data.validation_test.length_match ? 'Longueur OK' : 'Longueur incorrecte'}`);
        addLog(`Clé: ${data.validation_test.key_length} caractères (hex: ${data.validation_test.is_hex ? '✅' : '❌'})`);
      }
    } catch (error) {
      addLog(`Test validation échoué: ${error.message}`, 'warning');
    }
  };

  // Authentification
  const handleAuth = async () => {
    if (!backendReady) {
      setPaymentStatus('❌ Backend non disponible');
      addLog('Backend non disponible pour authentification', 'error');
      return;
    }

    addLog('Démarrage authentification Pi...');
    setPaymentStatus('Authentification en cours...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          uid: `user_${Date.now()}`,
          username: 'controlpi_user',
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setPaymentStatus('✅ Authentifié avec succès');
        addLog(`Utilisateur: ${data.user.username}`);
        addLog(`Session: ${data.user.session}`);
        addLog(`Backend: ${data.backend}`);
      } else {
        setPaymentStatus(`❌ Erreur: ${data.error || 'Inconnue'}`);
        addLog(`Erreur auth: ${data.error}`, 'error');
      }
    } catch (error) {
      setPaymentStatus('❌ Erreur réseau');
      addLog(`Erreur auth réseau: ${error.message}`, 'error');
    }
  };

  // Création de paiement
  const createPayment = async () => {
    if (!window.Pi) {
      setPaymentStatus('❌ SDK Pi non disponible');
      addLog('SDK Pi non disponible pour paiement', 'error');
      return;
    }

    if (!backendReady) {
      setPaymentStatus('❌ Backend non disponible');
      addLog('Backend non disponible pour paiement', 'error');
      return;
    }

    addLog('🚀 Démarrage création paiement');
    setPaymentStatus('Création paiement...');

    try {
      // 1. Créer le paiement
      const response = await fetch(`${BACKEND_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          amount: 3.14,
          memo: 'Test ControlPi - Validation Pi Developer Portal',
          product: 'Pi Network App Validation'
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

      addLog(`✅ Paiement créé: ${data.payment.identifier}`);
      addLog(`Montant: ${data.payment.amount} π`);
      addLog(`Mémo: ${data.payment.memo}`);
      setPaymentStatus('Paiement créé, attente SDK Pi...');

      // 2. Configuration des callbacks SDK Pi
      const onReadyForServerApproval = async (paymentId) => {
        addLog(`🔵 SDK prêt pour approbation: ${paymentId}`);
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
            addLog(`✅ Paiement approuvé: ${approveData.txid}`);
            setPaymentStatus('✅ Paiement approuvé !');
            
            // Compléter avec SDK Pi
            window.Pi.completePayment(paymentId, approveData.txid);
            addLog('📱 Paiement complété avec SDK Pi');
            
            // Notifier backend
            await fetch(`${BACKEND_URL}/api/payments/complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId,
                txid: approveData.txid
              })
            });
            
            addLog('✅ Backend notifié de la complétion');
            
            // Callback Pi Network
            await fetch(`${BACKEND_URL}/api/payments/callback`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId,
                txid: approveData.txid,
                status: 'completed',
                amount: 3.14,
                memo: data.payment.memo,
                timestamp: new Date().toISOString()
              })
            });
            
            addLog('📞 Callback Pi envoyé');
            
          } else {
            throw new Error(approveData.error || 'Erreur approbation');
          }
        } catch (error) {
          addLog(`❌ Erreur approbation: ${error.message}`, 'error');
          setPaymentStatus('❌ Erreur approbation');
        }
      };

      const onCancel = (paymentId, payment) => {
        addLog(`❌ Paiement annulé: ${paymentId}`);
        setPaymentStatus('❌ Paiement annulé par l\'utilisateur');
        
        // Notifier backend
        fetch(`${BACKEND_URL}/api/payments/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId,
            status: 'cancelled',
            reason: 'user_cancelled',
            timestamp: new Date().toISOString()
          })
        }).catch(e => console.error('Callback error:', e));
      };

      const onError = (error, payment) => {
        addLog(`❌ Erreur SDK Pi: ${error.message}`, 'error');
        setPaymentStatus('❌ Erreur SDK Pi');
        
        // Notifier backend
        fetch(`${BACKEND_URL}/api/payments/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: payment?.identifier,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          })
        }).catch(e => console.error('Callback error:', e));
      };

      // 3. Lancer le flux Pi SDK
      addLog('🚀 Lancement du flux Pi SDK...');
      window.Pi.createPayment(data.payment, {
        onReadyForServerApproval,
        onCancel,
        onError
      });

      addLog('✅ Flux SDK Pi lancé avec succès');

    } catch (error) {
      addLog(`❌ Erreur création paiement: ${error.message}`, 'error');
      setPaymentStatus(`❌ Erreur: ${error.message}`);
    }
  };

  // Test complet
  const runCompleteTest = async () => {
    addLog('='.repeat(50));
    addLog('🧪 DÉBUT TEST COMPLET CONTROLPI');
    addLog('='.repeat(50));
    
    setPaymentStatus('🧪 Test complet démarré...');
    
    await testBackendConnection();
    
    if (backendReady) {
      await handleAuth();
      await createPayment();
    } else {
      addLog('❌ Test arrêté: backend non disponible', 'error');
      setPaymentStatus('❌ Backend non disponible');
    }
    
    addLog('='.repeat(50));
    addLog('🏁 FIN TEST COMPLET CONTROLPI');
    addLog('='.repeat(50));
  };

  // Ouvrir diagnostic validation
  const openValidationDiagnostic = () => {
    window.open(`${BACKEND_URL}/validate-diagnostic`, '_blank');
  };

  // Ouvrir Pi Portal
  const openPiPortal = () => {
    window.open('https://develop.minepi.com', '_blank');
  };

  // Copier l'URL de validation
  const copyValidationUrl = () => {
    navigator.clipboard.writeText(`${BACKEND_URL}/validation-key.txt`);
    addLog('✅ URL validation copiée dans le presse-papier');
    alert(`URL copiée: ${BACKEND_URL}/validation-key.txt\n\nCollez cette URL dans Pi Developer Portal → Domain Verification`);
  };

  // Tester le fichier de validation directement
  const testValidationFile = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/validation-key.txt`);
      const text = await response.text();
      const isValid = text.trim().length === 128 && /^[0-9a-f]{128}$/i.test(text.trim());
      
      addLog(`📄 Test fichier validation: ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
      addLog(`Longueur: ${text.trim().length} caractères`);
      addLog(`Hex: ${/^[0-9a-f]+$/i.test(text.trim()) ? '✅ Oui' : '❌ Non'}`);
      
      if (!isValid) {
        addLog(`Contenu (premiers 50): ${text.substring(0, 50)}...`, 'warning');
      }
    } catch (error) {
      addLog(`❌ Erreur test validation: ${error.message}`, 'error');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>🎛️ ControlPi v2.0</h1>
          <p className="subtitle">Pi Network Integration - CodeSandbox Edition</p>
        </div>
        
        <div className="url-display">
          <div className="url-row">
            <div className="url-item">
              <span className="url-label">🌐 Frontend:</span>
              <code className="url-value">{FRONTEND_URL}</code>
            </div>
            <div className="url-item">
              <span className="url-label">⚙️ Backend:</span>
              <code className="url-value">{BACKEND_URL}</code>
              <span className={`status-badge ${backendReady ? 'status-online' : 'status-offline'}`}>
                {backendReady ? 'EN LIGNE' : 'HORS LIGNE'}
              </span>
            </div>
          </div>
          
          <div className="validation-url">
            <span className="url-label">🔑 Validation Pi:</span>
            <code className="url-value">{BACKEND_URL}/validation-key.txt</code>
            <button onClick={copyValidationUrl} className="btn-copy">📋 Copier</button>
            <span className={`status-badge ${validationChecked ? 'status-valid' : 'status-unknown'}`}>
              {validationChecked ? 'TESTÉ' : 'NON TESTÉ'}
            </span>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Section Statut */}
        <section className="card status-card">
          <h2><span className="icon">📡</span> Statut du Système</h2>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Connexion Backend:</span>
              <span className={`status-value ${status.includes('✅') ? 'status-good' : status.includes('❌') ? 'status-bad' : 'status-warning'}`}>
                {status}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Navigateur:</span>
              <span className={`status-value ${isPiBrowser ? 'status-good' : 'status-warning'}`}>
                {isPiBrowser ? 'Pi Browser ✅' : 'Autre navigateur ⚠️'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">SDK Pi:</span>
              <span className={`status-value ${window.Pi ? 'status-good' : 'status-warning'}`}>
                {window.Pi ? 'Chargé ✅' : 'Chargement...'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Utilisateur:</span>
              <span className="status-value">
                {user ? `${user.username}` : 'Non authentifié'}
              </span>
            </div>
            {validationResult && (
              <div className="status-item">
                <span className="status-label">Validation:</span>
                <span className={`status-value ${validationResult.length_match && validationResult.is_hex ? 'status-good' : 'status-bad'}`}>
                  {validationResult.length_match ? `${validationResult.key_length} chars ✅` : `${validationResult.key_length} chars ❌`}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Section Contrôles */}
        <section className="card controls-card">
          <h2><span className="icon">🎮</span> Contrôles</h2>
          
          <div className="controls-grid">
            <div className="control-group">
              <h3>Tests de Base</h3>
              <div className="button-group">
                <button onClick={testBackendConnection} className="btn btn-primary">
                  <span className="btn-icon">🔄</span>
                  <span className="btn-text">Tester Backend</span>
                </button>
                <button onClick={handleAuth} className="btn btn-secondary" disabled={!backendReady}>
                  <span className="btn-icon">🔐</span>
                  <span className="btn-text">Authentification</span>
                </button>
                <button onClick={testValidationFile} className="btn btn-info">
                  <span className="btn-icon">🔍</span>
                  <span className="btn-text">Tester Validation</span>
                </button>
              </div>
            </div>
            
            <div className="control-group">
              <h3>Paiement Pi</h3>
              <div className="button-group">
                <button onClick={createPayment} className="btn btn-success" disabled={!backendReady || !window.Pi}>
                  <span className="btn-icon">💰</span>
                  <span className="btn-text">Tester Paiement (3.14 π)</span>
                </button>
                <button onClick={runCompleteTest} className="btn btn-warning" disabled={!backendReady}>
                  <span className="btn-icon">🧪</span>
                  <span className="btn-text">Test Complet</span>
                </button>
              </div>
            </div>
            
            <div className="control-group">
              <h3>Outils</h3>
              <div className="button-group">
                <button onClick={openValidationDiagnostic} className="btn btn-dark">
                  <span className="btn-icon">📊</span>
                  <span className="btn-text">Diagnostic</span>
                </button>
                <button onClick={openPiPortal} className="btn btn-dark">
                  <span className="btn-icon">🌐</span>
                  <span className="btn-text">Pi Portal</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="payment-status">
            <h3>Statut Paiement:</h3>
            <div className="payment-message">{paymentStatus || 'Prêt pour transaction...'}</div>
          </div>
        </section>

        {/* Section Instructions */}
        <section className="card instructions-card">
          <h2><span className="icon">📋</span> Instructions Pi Developer Portal</h2>
          
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Validation du Domaine</h4>
                <p>Dans Pi Developer Portal → Settings → Domain & Security</p>
                <div className="step-code-block">
                  <code>URL à utiliser: {BACKEND_URL}/validation-key.txt</code>
                  <button onClick={copyValidationUrl} className="btn-small">📋 Copier</button>
                </div>
                <p className="step-note">Assurez-vous que le fichier est accessible et contient exactement 128 caractères hexadécimaux.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Configuration API</h4>
                <div className="config-list">
                  <div className="config-item">
                    <span className="config-label">API Base URL:</span>
                    <code className="config-value">{BACKEND_URL}</code>
                  </div>
                  <div className="config-item">
                    <span className="config-label">Callback URL:</span>
                    <code className="config-value">{BACKEND_URL}/api/payments/callback</code>
                  </div>
                  <div className="config-item">
                    <span className="config-label">Redirect URLs:</span>
                    <code className="config-value">{FRONTEND_URL}</code>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Test de Transaction</h4>
                <ol className="step-list">
                  <li>Ouvrir cette page dans <strong>Pi Browser</strong></li>
                  <li>Cliquer sur <strong>"Tester Backend"</strong> (doit afficher ✅)</li>
                  <li>Cliquer sur <strong>"Authentification"</strong></li>
                  <li>Cliquer sur <strong>"Tester Paiement"</strong></li>
                  <li>Compléter la transaction dans <strong>Pi Wallet</strong></li>
                </ol>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Validation Finale</h4>
                <p>Si la transaction réussit:</p>
                <ul className="step-list">
                  <li>L'étape <strong>"Process a Transaction on the App"</strong> devient verte dans Pi Portal</li>
                  <li>Votre application est officiellement validée ! 🎉</li>
                  <li>Vous pouvez maintenant recevoir des paiements Pi réels</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section Logs */}
        <section className="card logs-card">
          <h2><span className="icon">📝</span> Logs en Temps Réel</h2>
          <div className="logs-container">
            {logs.length > 0 ? (
              <div className="logs-content">
                {logs.map((log, index) => (
                  <div key={index} className="log-entry">
                    <span className="log-timestamp">[{log.match(/\[(.*?)\]/)?.[1] || ''}]</span>
                    <span className="log-message">{log.replace(/\[.*?\]/, '')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-logs">En attente de logs...</div>
            )}
          </div>
          <div className="logs-controls">
            <button onClick={() => setLogs([])} className="btn btn-small">
              <span className="btn-icon">🗑️</span>
              Effacer logs
            </button>
            <button onClick={() => navigator.clipboard.writeText(logs.join('\n'))} className="btn btn-small">
              <span className="btn-icon">📋</span>
              Copier logs
            </button>
            <div className="logs-info">{logs.length} entrées</div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>ControlPi v2.0</h3>
            <p>Plateforme d'intégration Pi Network</p>
            <p className="footer-version">Backend: CodeSandbox | Frontend: Vercel</p>
          </div>
          
          <div className="footer-section">
            <h3>Liens Utiles</h3>
            <div className="footer-links">
              <a href={`${BACKEND_URL}/health`} target="_blank" rel="noopener noreferrer">
                <span className="link-icon">❤️</span> Health Check
              </a>
              <a href={`${BACKEND_URL}/validate-diagnostic`} target="_blank" rel="noopener noreferrer">
                <span className="link-icon">🔍</span> Diagnostic
              </a>
              <a href="https://develop.minepi.com" target="_blank" rel="noopener noreferrer">
                <span className="link-icon">🌐</span> Pi Portal
              </a>
              <a href={`${BACKEND_URL}/validation-key.txt`} target="_blank" rel="noopener noreferrer">
                <span className="link-icon">🔑</span> Fichier Validation
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Statut</h3>
            <div className="footer-status">
              <div className="status-indicator">
                <span className={`status-dot ${backendReady ? 'online' : 'offline'}`}></span>
                <span>Backend: {backendReady ? 'En ligne' : 'Hors ligne'}</span>
              </div>
              <div className="status-indicator">
                <span className={`status-dot ${validationChecked ? 'online' : 'offline'}`}></span>
                <span>Validation: {validationChecked ? 'Testée' : 'Non testée'}</span>
              </div>
              <div className="status-indicator">
                <span className={`status-dot ${window.Pi ? 'online' : 'offline'}`}></span>
                <span>SDK Pi: {window.Pi ? 'Chargé' : 'Non chargé'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>Pour validation Pi Developer Portal: Test complet dans Pi Browser → Vérifier "Process a Transaction" → Si vert ✅, app validée!</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
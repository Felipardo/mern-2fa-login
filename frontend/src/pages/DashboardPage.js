import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verifySignature } from '../utils/verifySignature';
import '../styles/globalForm.css';

const DashboardPage = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [signatureStatus, setSignatureStatus] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
     try {
  const res = await axios.get(`${process.env.REACT_APP_API_URL}/auth/protected`, {
    headers: { Authorization: `Bearer ${token}` },
  });


        setMessage(res.data.message);
      } catch (err) {
        setMessage('Acceso denegado');
        logout();
        navigate('/login');
      }
    };

    const checkSignature = async () => {
      const signedMessage = localStorage.getItem('signedMessage');
      const signature = localStorage.getItem('signature');
      if (signedMessage && signature) {
        const isValid = await verifySignature(signedMessage, signature);
        setSignatureStatus(isValid ? 'válida' : 'inválida');
      } else {
        setSignatureStatus('desconocida');
      }
    };

    fetchData();
    checkSignature();
  }, [token, logout, navigate]);

  useEffect(() => {
    let countdownInterval;

    const startCountdown = () => {
      clearInterval(countdownInterval);
      setTimeLeft(60);

      countdownInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            logout();
            setSessionExpired(true);
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleActivity = () => {
      startCountdown();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((event) => window.addEventListener(event, handleActivity));

    startCountdown();

    return () => {
      clearInterval(countdownInterval);
      events.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [logout, navigate]);

  return (
    <div className="form-container" style={{ textAlign: 'center', position: 'relative' }}>
      <h2 className="form-title">Mi Perfil</h2>
      <h3 className="form-subtitle">Información general del usuario</h3>

      <div style={{
        backgroundColor: '#251930',
        padding: '20px',
        borderRadius: '20px',
        color: '#fff',
        marginBottom: '20px',
        boxShadow: '0 0 10px rgba(0,0,0,0.3)'
      }}>
        <p><strong>Correo:</strong> {user?.email || 'correo@ejemplo.com'}</p>
        <p><strong>Autenticación 2FA:</strong> Sí</p>
        {message && <p style={{ marginTop: '10px' }}>{message}</p>}
        {sessionExpired && (
          <p style={{ color: 'tomato', fontWeight: 'bold', marginTop: '10px' }}>
            Sesión cerrada por inactividad ⏱️
          </p>
        )}
        {signatureStatus && (
          <p style={{
            marginTop: '10px',
            color: signatureStatus === 'válida' ? '#00e676' : 'tomato',
            fontWeight: 'bold'
          }}>
            Firma digital: {signatureStatus === 'válida' ? '✅ Válida' : '❌ Inválida'}
          </p>
        )}
      </div>

      <button onClick={logout}>Cerrar sesión</button>

      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: '#251930',
        color: 'white',
        padding: '8px 14px',
        borderRadius: '8px',
        fontSize: '0.9rem',
        opacity: 0.85
      }}>
        Tiempo restante: {timeLeft}s
      </div>
    </div>
  );
};

export default DashboardPage;

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/globalForm.css';

const Select2FAMethodPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { email } = state || {};

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSelect = (method) => {
    if (method === 'qr') {
      navigate('/verify-2fa-qr', { state: { email } });
    } else {
      handleSendCode();
    }
  };

  const handleSendCode = async () => {
    if (cooldown > 0) return;

    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/auth/send-code', { email });
      navigate('/verify-2fa-email', { state: { email } });
    } catch (err) {
      console.error('Error al enviar código por correo:', err);
    } finally {
      setLoading(false);
      setCooldown(30);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) clearInterval(interval);
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Selecciona tu método 2FA</h2>
      <h3 className="form-subtitle">Elige cómo deseas verificar tu identidad</h3>

      <button onClick={() => handleSelect('qr')} style={{ marginBottom: '16px' }}>
        Usar Google Authenticator (QR)
      </button>

      <button
        onClick={() => handleSelect('email')}
        disabled={cooldown > 0 || loading}
      >
        {cooldown > 0
          ? `Reenviar en ${cooldown}s`
          : loading
          ? 'Enviando...'
          : 'Enviar código por correo'}
      </button>
    </div>
  );
};

export default Select2FAMethodPage;

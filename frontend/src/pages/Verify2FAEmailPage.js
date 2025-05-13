import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/globalForm.css';
import { verifySignature } from '../utils/verifySignature';

const Verify2FAEmailPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email;

  const { login } = useAuth();

  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);

  // Temporizador
  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  // Verificación del código 2FA por correo
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/verify-2fa`, {
        email,
        token
      });

      const { signedMessage, signature, token: jwt } = res.data;

      const valid = await verifySignature(signedMessage, signature);

      if (!valid) {
        alert('❌ Firma digital inválida. Posible manipulación de datos.');
        return;
      }

      localStorage.setItem('token', jwt);
      localStorage.setItem('signedMessage', signedMessage);
      localStorage.setItem('signature', signature);

      login(jwt);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Código inválido');
    }
  };

  // Reenvío del código
  const handleResendCode = async () => {
    if (cooldown > 0 || isSending) return;

    try {
      setIsSending(true);
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/resend-code`, { email });
      setCooldown(30);
    } catch (err) {
      console.error('Error reenviando código', err);
      setError('No se pudo reenviar el código. Intenta más tarde.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Verificación por correo</h2>
      <h3 className="form-subtitle">Ingresa el código que enviamos a tu correo</h3>
      <form onSubmit={handleVerify}>
        <div className="textbox">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            placeholder=" "
          />
          <label>Código de verificación</label>
        </div>
        <button type="submit">Verificar</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button
        onClick={handleResendCode}
        disabled={cooldown > 0 || isSending}
        style={{ marginTop: '12px' }}
      >
        {cooldown > 0 ? `Reenviar en ${cooldown}s` : isSending ? 'Enviando...' : 'Reenviar código'}
      </button>
    </div>
  );
};

export default Verify2FAEmailPage;

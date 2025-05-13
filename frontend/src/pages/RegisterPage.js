import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/globalForm.css';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityLevel, setSecurityLevel] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [color, setColor] = useState('bg-red-500');
  const [message, setMessage] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);

  // Validación visual de la contraseña
  const validatePassword = (value) => {
    let level = 0;
    if (value.length >= 8) level++;
    if (/[A-Z]/.test(value)) level++;
    if (/\d/.test(value)) level++;
    if (/[^A-Za-z0-9]/.test(value)) level++;
    setSecurityLevel(level);

    switch (level) {
      case 1:
      case 2:
        setColor('bg-red-500');
        setFeedback('Contraseña débil');
        break;
      case 3:
        setColor('bg-yellow-500');
        setFeedback('Contraseña intermedia');
        break;
      case 4:
        setColor('bg-green-500');
        setFeedback('Contraseña fuerte');
        break;
      default:
        setColor('bg-red-500');
        setFeedback('Muy insegura');
    }
  };

  // Enviar código por correo
  const handleSendVerificationCode = async (e) => {
    e.preventDefault();
    setMessage('');
   try {
  const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/send-verification-code`, { email });
  setMessage(res.data.message);
  setStep(2);
  setCooldown(30);
} catch (err) {
  setMessage(err.response?.data?.message || 'Error enviando código');
}

  };

  // Verificar código y registrar
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/verify-email-code`, {
        email,
        password,
        code: verificationCode,
      });
      setQrCode(res.data.qrCode);
      setShowQR(true);
      setStep(3);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Código incorrecto o expirado');
    }
  };

  // Cooldown para reenviar código
  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  // Reenviar código
  const handleResendCode = async () => {
    if (cooldown > 0 || isSending) return;
    try {
      setIsSending(true);
      await axios.post('http://localhost:5000/api/auth/send-verification-code', { email });
      setMessage('Código reenviado');
      setCooldown(30);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error reenviando código');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Registro</h2>
      <h3 className="form-subtitle">Crea tu cuenta con verificación</h3>

      {/* Paso 1: formulario */}
      {step === 1 && (
        <form onSubmit={handleSendVerificationCode}>
          <div className="textbox">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder=" "
            />
            <label>Correo electrónico</label>
          </div>

          <div className="textbox">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
              }}
              required
              placeholder=" "
            />
            <label>Contraseña</label>
          </div>

          <div className="h-2 w-full rounded mt-2">
            <div className={`h-2 rounded ${color}`} style={{ width: `${securityLevel * 25}%` }}></div>
          </div>
          <p>{feedback}</p>

          <button type="submit">Enviar código de verificación</button>
        </form>
      )}

      {/* Paso 2: verificación */}
      {step === 2 && (
        <form onSubmit={handleVerifyAndRegister}>
          <div className="textbox">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              placeholder=" "
            />
            <label>Código enviado por correo</label>
          </div>

          <button type="submit">Verificar y crear cuenta</button>

          <button
            type="button"
            disabled={cooldown > 0}
            onClick={handleResendCode}
            className="mt-3"
            style={{
              backgroundColor: cooldown > 0 ? '#ccc' : '#facc15',
              color: '#000',
              padding: '0.5rem',
              borderRadius: '4px',
              cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
              border: 'none'
            }}
          >
            {cooldown > 0 ? `Reenviar código (${cooldown}s)` : 'Reenviar código'}
          </button>
        </form>
      )}

      {/* Paso 3: QR final */}
      {step === 3 && showQR && (
        <div className="text-center mt-6">
          <h3 className="font-semibold text-lg mb-2">Escanea el código QR</h3>
          <img src={qrCode} alt="QR Code" className="mx-auto my-4" />
          <a href="/login" className="text-blue-600 underline">Ir al login</a>
        </div>
      )}

      {message && <p style={{ color: 'red' }}>{message}</p>}
    </div>
  );
};

export default RegisterPage;

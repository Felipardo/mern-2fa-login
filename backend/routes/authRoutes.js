const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');

const User = require('../models/User');
const protect = require('../middleware/authMiddleware');
const { send2FACode } = require('../utils/emailService');
const EmailVerification = require('../models/EmailVerification');

const fs = require('fs');
const path = require('path');



// ===========================================
// Función local para firmar con key.pem

function signData(message) {
  const privateKeyPath = path.join(__dirname, '../cert/key.pem');
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

  const signature = crypto.sign("sha256", Buffer.from(message), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32 
  });

  return signature.toString('base64');
}

// ===========================================

// ===========================================
// 1. Verificación de Correo antes del Registro
// ===========================================
router.post('/send-verification-code', async (req, res) => {
  const { email } = req.body;

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await EmailVerification.findOneAndUpdate(
      { email },
      {
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      },
      { upsert: true }
    );

    await send2FACode(email, code);
    res.status(200).json({ message: 'Código enviado al correo' });
  } catch (err) {
    res.status(500).json({ message: 'Error enviando código', error: err.message });
  }
});

router.post('/verify-email-code', async (req, res) => {
  const { email, code, password } = req.body;

  try {
    const record = await EmailVerification.findOne({ email });
    if (!record || record.code !== code || record.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    await EmailVerification.deleteOne({ email });

    const hashedPassword = await bcrypt.hash(password, 10);
    const secret = speakeasy.generateSecret({ name: `MERN-2FA (${email})` });
    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    const newUser = new User({
      email,
      password: hashedPassword,
      isTwoFactorEnabled: true,
      twoFactorSecret: secret.base32,
      twoFAMethod: ['qr', 'email']
    });

    await newUser.save();

    res.status(201).json({
      message: 'Usuario verificado y creado',
      qrCode,
      secret: secret.base32
    });

  } catch (err) {
    res.status(500).json({ message: 'Error verificando código', error: err.message });
  }
});

// ===========================================
// 2. Login y flujo de autenticación
// ===========================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta' });

    if (user.isTwoFactorEnabled) {
      return res.status(200).json({
        message: '2FA requerido',
        require2FA: true,
        methods: user.twoFAMethod,
        email
      });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    // ✅ Firmar mensaje con clave privada
    const signedMessage = `Usuario ${user.email} inició sesión correctamente`;
    const signature = signData(signedMessage);

    res.status(200).json({
      message: 'Login exitoso',
      token,
      signedMessage,
      signature
    });
  } catch (err) {
    res.status(500).json({ message: 'Error en el login', error: err.message });
  }
});

// ===========================================
// 3. Verificación del código 2FA (QR o Email)
// ===========================================
router.post('/verify-2fa', async (req, res) => {
  const { email, token } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA no habilitado para este usuario' });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!isValid) {
      return res.status(401).json({ message: 'Código 2FA incorrecto' });
    }

    // ✅ Generar token
    const jwtToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    // ✅ Firmar mensaje
    const signedMessage = `Usuario ${user.email} inició sesión correctamente`;
    const signature = signData(signedMessage);

    res.status(200).json({
      message: '2FA verificado',
      token: jwtToken,
      signedMessage,
      signature
    });

  } catch (err) {
    console.error('❌ Error verificando 2FA:', err);
    res.status(500).json({ message: 'Error verificando 2FA', error: err.message });
  }
});


// ===========================================
// 4. Envío inicial del código 2FA por correo
// ===========================================
router.post('/send-code', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.twoFAMethod.includes('email')) {
      return res.status(400).json({ message: 'Método no válido para este usuario' });
    }

    const code = speakeasy.totp({
      secret: user.twoFactorSecret,
      encoding: 'base32'
    });

    await send2FACode(email, code);
    res.status(200).json({ message: 'Código enviado por correo' });

  } catch (err) {
    res.status(500).json({ message: 'Error enviando código', error: err.message });
  }
});

// ===========================================
// 5. Reenvío del código 2FA
// ===========================================
router.post('/resend-code', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.twoFAMethod.includes('email')) {
      return res.status(400).json({ message: 'Usuario no válido o método no soportado' });
    }

    const code = speakeasy.totp({
      secret: user.twoFactorSecret,
      encoding: 'base32'
    });

    await send2FACode(email, code);
    res.status(200).json({ message: 'Código reenviado por correo' });
  } catch (err) {
    res.status(500).json({ message: 'Error reenviando código', error: err.message });
  }
});

// ===========================================
// 6. Ruta protegida
// ===========================================
router.get('/protected', protect, (req, res) => {
  res.status(200).json({
    message: 'Acceso concedido a ruta protegida',
    userId: req.user.id
  });
});

// ===========================================
// 7. Obtener clave pública
// ===========================================
router.get('/public-key', (req, res) => {
  try {
    const publicKey = fs.readFileSync(path.join(__dirname, '../cert/public.pem'), 'utf8');
    res.status(200).send(publicKey);
  } catch (err) {
    res.status(500).json({ message: 'Error cargando clave pública', error: err.message });
  }
});


module.exports = router;

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generar par de llaves RSA
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki', // compatible con WebCrypto
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Crear carpeta si no existe
const certDir = path.join(__dirname, 'cert');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
}

// Guardar llaves
fs.writeFileSync(path.join(certDir, 'public.pem'), publicKey);
fs.writeFileSync(path.join(certDir, 'key.pem'), privateKey);

console.log('✅ Llaves RSA generadas en ./cert');

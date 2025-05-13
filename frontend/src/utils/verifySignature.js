export async function verifySignature(message, signatureBase64) {
  console.log('📝 Verificando firma digital...');
  console.log('📩 Mensaje firmado:', message);
  console.log('🔏 Firma base64:', signatureBase64);

  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/public-key`);
    const pem = await response.text(); // ✅ Aquí defines correctamente la variable

    console.log('📜 Clave pública PEM recibida:\n', pem);

    const binaryDer = convertPemToBinary(pem);
    console.log('📦 Clave pública convertida a ArrayBuffer:', binaryDer);

    const cryptoKey = await window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      { name: 'RSA-PSS', hash: 'SHA-256' },
      true,
      ['verify']
    );
    console.log('🔓 Clave pública importada correctamente');

    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const signature = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

    const isValid = await window.crypto.subtle.verify(
      { name: 'RSA-PSS', saltLength: 32 },
      cryptoKey,
      signature,
      data
    );

    console.log(`✅ Resultado de verificación: ${isValid ? 'válida' : 'inválida'}`);
    return isValid;
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    return false;
  }
}

function convertPemToBinary(pem) {
  const lines = pem.split('\n');
  const base64Lines = lines.filter(line =>
    line.trim() && !line.includes('BEGIN PUBLIC KEY') && !line.includes('END PUBLIC KEY')
  );
  const base64 = base64Lines.join('');
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

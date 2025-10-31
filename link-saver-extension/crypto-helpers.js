// crypto-helpers.js

// 从主密码派生出用于加密的密钥
async function getKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// 加密函数
async function encryptSecret(secretKey, masterPassword) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKeyFromPassword(masterPassword, salt);
  const enc = new TextEncoder();

  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(secretKey)
  );

  const encryptedBytes = new Uint8Array(encryptedContent);
  // 将 salt, iv, 和密文组合在一起存储
  const fullMessage = new Uint8Array(salt.length + iv.length + encryptedBytes.length);
  fullMessage.set(salt);
  fullMessage.set(iv, salt.length);
  fullMessage.set(encryptedBytes, salt.length + iv.length);

  // 转换为 Base64 字符串以便存储
  return btoa(String.fromCharCode.apply(null, fullMessage));
}

// 解密函数
async function decryptSecret(encryptedBase64, masterPassword) {
  try {
    const fullMessage = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    const salt = fullMessage.slice(0, 16);
    const iv = fullMessage.slice(16, 28);
    const encryptedContent = fullMessage.slice(28);
    
    const key = await getKeyFromPassword(masterPassword, salt);
    
    const decryptedContent = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encryptedContent
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
  } catch (e) {
    console.error("Decryption failed:", e);
    return null; // 解密失败返回 null
  }
}
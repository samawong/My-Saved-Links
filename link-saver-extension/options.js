// options.js

// 保存设置
async function saveOptions() {
  const workerUrl = document.getElementById('workerUrl').value;
  const secretKey = document.getElementById('secretKey').value;
  const masterPassword = document.getElementById('masterPassword').value;
  const status = document.getElementById('status');

  if (!masterPassword && !secretKey) {
     // 如果没有主密码，并且没有新的 secret key，只保存 URL
     chrome.storage.local.set({ workerUrl });
     status.textContent = 'Worker URL saved.';
     setTimeout(() => { status.textContent = ''; }, 2000);
     return;
  }

  if (!masterPassword) {
    status.textContent = 'Error: Master Password is required to save a new Secret Key.';
    return;
  }
  if (!secretKey) {
    status.textContent = 'Error: Secret Key cannot be empty when setting a Master Password.';
    return;
  }
  
  status.textContent = 'Encrypting and saving...';
  
  const encryptedSecret = await encryptSecret(secretKey, masterPassword);
  
  // 注意：我们改用 chrome.storage.local，因为 sync 有大小限制，且不应同步加密密钥
  chrome.storage.local.set({
    workerUrl: workerUrl,
    encryptedSecret: encryptedSecret
  }, () => {
    status.textContent = 'Settings saved securely!';
    document.getElementById('secretKey').value = ''; // 清空
    document.getElementById('masterPassword').value = ''; // 清空
    setTimeout(() => { status.textContent = ''; }, 3000);
  });
}

// 加载设置（只加载 URL，因为密钥是加密的）
function restoreOptions() {
  chrome.storage.local.get({ workerUrl: '' }, (items) => {
    document.getElementById('workerUrl').value = items.workerUrl;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);
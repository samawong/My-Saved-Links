let decryptedSecretKey = null;

// 提取网页元数据的函数，将在目标页面执行
function getPageDetails() {
  const getMeta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || null;
  const getIcon = () => {
    let icon = document.querySelector('link[rel="icon"]')?.href || 
               document.querySelector('link[rel="shortcut icon"]')?.href;
    if (icon && !icon.startsWith('http')) {
      icon = new URL(icon, document.baseURI).href;
    }
    return icon;
  };

  return {
    title: document.title,
    description: getMeta('description'),
    icon: getIcon(),
    url: location.href,
  };
}

document.getElementById('saveBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const saveBtn = document.getElementById('saveBtn');
  const tagsInput = document.getElementById('tags');

  saveBtn.disabled = true;
  statusEl.textContent = 'Getting URL...';

  // 1. 从 Chrome 存储中获取 Worker URL
  chrome.storage.sync.get(['workerUrl', 'secretKey'], async ({ workerUrl, secretKey }) => {
    if (!workerUrl || !secretKey) {
      statusEl.innerHTML = 'URL or Key not set. <a href="#" id="openOptions">Open Settings</a>';
      document.getElementById('openOptions').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
      });
      saveBtn.disabled = false;
      return;
    }

    statusEl.textContent = 'Saving...';

    // 2. 获取当前标签页信息
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getPageDetails,
    });
    const pageDetails = results[0].result;

    pageDetails.tags = document.getElementById('tags').value.split(',')
      .map(tag => tag.trim()).filter(Boolean);

  // 3. 发送带有认证头的请求
    try {
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': secretKey // 在这里带上密钥！
        },
        body: JSON.stringify(pageDetails),
      });

      if (response.ok) {
        statusEl.textContent = 'Successfully saved!';
      } else {
        const errorText = await response.text();
        statusEl.textContent = `Error: ${errorText}`;
      }
    } catch (error) {
      statusEl.textContent = 'Failed to connect.';
    } finally {
      saveBtn.disabled = false;
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }
  });
});

async function getDecryptedKey() {
  if (decryptedSecretKey) {
    return decryptedSecretKey;
  }

  const { encryptedSecret } = await chrome.storage.local.get('encryptedSecret');
  if (!encryptedSecret) {
    return null;
  }
  
  const masterPassword = prompt("Please enter your Master Password:");
  if (!masterPassword) {
    return null;
  }

  const key = await decryptSecret(encryptedSecret, masterPassword);
  if (key) {
    decryptedSecretKey = key; // 缓存解密后的密钥
    return key;
  } else {
    alert("Decryption failed. Incorrect Master Password.");
    return null;
  }
}



document.getElementById('saveBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const saveBtn = document.getElementById('saveBtn');

  saveBtn.disabled = true;
  
  const { workerUrl } = await chrome.storage.local.get('workerUrl');
  const secretKey = await getDecryptedKey();
  
  if (!workerUrl || !secretKey) {
    statusEl.innerHTML = 'Setup needed or Master Password incorrect. <a href="#" id="openOptions">Open Settings</a>';
    document.getElementById('openOptions')?.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
    saveBtn.disabled = false;
    return;
  }

  statusEl.textContent = 'Saving...';
  // ... 后续逻辑与之前一样，使用获取到的 secretKey ...
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({ /*...*/ });
  const pageDetails = results[0].result;
  pageDetails.tags = document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(Boolean);

  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': secretKey
      },
      body: JSON.stringify(pageDetails),
    });
    // ... 处理 response ...
  } catch (error) {
    // ... 处理 error ...
  } finally {
    saveBtn.disabled = false;
    // ...
  }
});
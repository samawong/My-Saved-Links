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

document.getElementById('saveBtn').addEventListener('click', () => {
  const statusEl = document.getElementById('status');
  const saveBtn = document.getElementById('saveBtn');

  saveBtn.disabled = true;

  // 1. 从存储中同时获取 URL 和 Key
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

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getPageDetails,
    });
    const pageDetails = results[0].result;
    
    pageDetails.tags = document.getElementById('tags').value.split(',')
      .map(tag => tag.trim()).filter(Boolean);

    // 2. 发送带有认证头的请求
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

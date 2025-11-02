// 保存设置
function saveOptions() {
  const workerUrl = document.getElementById('workerUrl').value;
  const secretKey = document.getElementById('secretKey').value;
  
  chrome.storage.sync.set({
    workerUrl: workerUrl,
    secretKey: secretKey // 保存 secretKey
  }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Settings saved.';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
}

// 加载已保存的设置
function restoreOptions() {
  chrome.storage.sync.get({
    workerUrl: '',
    secretKey: '' // 读取 secretKey
  }, (items) => {
    document.getElementById('workerUrl').value = items.workerUrl;
    document.getElementById('secretKey').value = items.secretKey;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);

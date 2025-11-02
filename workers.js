const GITHUB_REPO_URL = 'https://github.com/samawong/My-Saved-Links';
// CORS 预检请求处理函数
const handleCors = (request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // 增加了 PUT
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
  };
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  return { headers };
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') { return handleCors(request); }
    const url = new URL(request.url);
    const pathname = url.pathname;
    const { headers } = handleCors(request);

    // POST /api/links - 保存新链接 (支持标签)
    if (request.method === 'POST' && pathname === '/api/links') {
      try {
        const newLink = await request.json();
        if (!newLink.url || !newLink.title) {
          return new Response('Missing url or title', { status: 400 });
        }
        const linksJson = await env.LINKS_DB.get('links');
        const links = linksJson ? JSON.parse(linksJson) : [];
        if (!links.some(link => link.url === newLink.url)) {
          // 确保 tags 是一个数组
          newLink.tags = newLink.tags || [];
          links.unshift(newLink);
          await env.LINKS_DB.put('links', JSON.stringify(links));
        }
        return new Response(JSON.stringify({ success: true }), { headers: { ...headers, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(e.message, { status: 500 });
      }
    }

    // PUT /api/links - 更新一个链接 (编辑功能)
    if (request.method === 'PUT' && pathname === '/api/links') {
      const clientToken = request.headers.get('X-Auth-Token');
      if (!clientToken || clientToken !== env.AUTH_SECRET) {
        return new Response('Unauthorized', { status: 401, headers });
      }
      try {
        const { urlToUpdate, title, description } = await request.json();
        if (!urlToUpdate) {
          return new Response('Missing urlToUpdate', { status: 400 });
        }
        const linksJson = await env.LINKS_DB.get('links');
        let links = linksJson ? JSON.parse(linksJson) : [];
        const linkIndex = links.findIndex(link => link.url === urlToUpdate);
        if (linkIndex === -1) {
          return new Response('Link not found', { status: 404 });
        }
        links[linkIndex].title = title;
        links[linkIndex].description = description;
        await env.LINKS_DB.put('links', JSON.stringify(links));
        return new Response(JSON.stringify({ success: true }), { headers: { ...headers, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(e.message, { status: 500 });
      }
    }
    
    // DELETE /api/links - 删除一个链接 (无变化)
    if (request.method === 'DELETE' && pathname === '/api/links') {
       const clientToken = request.headers.get('X-Auth-Token');
      if (!clientToken || clientToken !== env.AUTH_SECRET) {
        return new Response('Unauthorized', { status: 401, headers });
      }
      try {
        const { urlToDelete } = await request.json();
        if (!urlToDelete) { return new Response('Missing urlToDelete', { status: 400 }); }
        const linksJson = await env.LINKS_DB.get('links');
        let links = linksJson ? JSON.parse(linksJson) : [];
        const updatedLinks = links.filter(link => link.url !== urlToDelete);
        await env.LINKS_DB.put('links', JSON.stringify(updatedLinks));
        return new Response(JSON.stringify({ success: true }), { headers: { ...headers, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(e.message, { status: 500 });
      }
    }

    // GET /api/links - 获取链接列表 (无变化)
    if (request.method === 'GET' && pathname === '/api/links') {
      const linksJson = await env.LINKS_DB.get('links');
      const links = linksJson ? JSON.parse(linksJson) : [];
      return new Response(JSON.stringify(links), { headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    // GET / - 显示主网页 (重大更新)
    if (request.method === 'GET' && pathname === '/') {
      const canonicalURL = url.origin + url.pathname;
      const pageTitle = "My Saved Links - A Personal Link Dashboard";
      const pageDescription = "A personal, self-hosted link saving service powered by Cloudflare Workers. Browse, search, and manage your saved bookmarks from a clean and modern interface.";
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>

    <!-- SEO Meta Tags -->
    <meta name="description" content="${pageDescription}">
    <meta name="author" content="samawong">
    <meta name="keywords" content="bookmarks, links, saver, cloudflare workers, serverless, personal dashboard">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalURL}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonicalURL}">
    <meta property="og:title" content="${pageTitle}">
    <meta property="og:description" content="${pageDescription}">
    <meta property="og:image" content="https://user-images.githubusercontent.com/1582299/148220021-096d4943-525b-4811-9a2c-29b35a399434.png">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${canonicalURL}">
    <meta property="twitter:title" content="${pageTitle}">
    <meta property="twitter:description" content="${pageDescription}">
    <meta property="twitter:image" content="https://user-images.githubusercontent.com/1582299/148220021-096d4943-525b-4811-9a2c-29b35a399434.png">

    <!-- Favicon (Emoji) -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔖</text></svg>">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">

    <style>
      :root {
        --background-color: #f8f9fa;
        --text-color: #212529;
        --card-background: #ffffff;
        --primary-color: #007bff;
        --border-color: #dee2e6;
        --shadow-color: rgba(0, 0, 0, 0.08);
        --tag-background: #e9ecef;
      }
      
      [data-theme="dark"] {
        --background-color: #121212;
        --text-color: #e0e0e0;
        --card-background: #1e1e1e;
        --primary-color: #bb86fc;
        --border-color: #333;
        --shadow-color: rgba(0, 0, 0, 0.4);
        --tag-background: #333;
      }

      * { box-sizing: border-box; }

      body {
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        line-height: 1.6;
        color: var(--text-color);
        background-color: var(--background-color);
        margin: 0;
        padding: 20px;
        transition: background-color 0.3s, color 0.3s;
      }

      .container { max-width: 1200px; margin: 0 auto; }
      
      header { text-align: center; margin-bottom: 40px; }
      header h1 { font-weight: 600; color: var(--text-color); }
      
      #controls { display: flex; justify-content: center; margin-bottom: 30px; gap: 10px; }
      #searchBox { width: 100%; max-width: 400px; padding: 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 8px; }
      #tags-container { text-align: center; margin-bottom: 30px; }
      .tag { background-color: #e0e0e0; color: #333; padding: 5px 12px; border-radius: 16px; font-size: 14px; cursor: pointer; display: inline-block; margin: 4px; transition: background-color 0.2s; }
      .tag:hover, .tag.active { background-color: #007bff; color: white; }
      #links-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
      .link-card { background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; display: flex; flex-direction: column; }
      .link-card a.main-link { text-decoration: none; color: inherit; display: block; flex-grow: 1; }
      .link-card .content { padding: 15px; }
      .title-wrapper { display: flex; align-items: center; margin-bottom: 10px; }
      .link-card img { width: 24px; height: 24px; margin-right: 10px; border-radius: 4px; }
      .link-card h3 { margin: 0; font-size: 1.1em; }
      .link-card p { font-size: 0.9em; color: #666; margin: 0; }
      .card-tags { padding: 0 15px 10px; }
      .card-tag { background-color: #f0f0f0; padding: 2px 8px; font-size: 12px; border-radius: 4px; display: inline-block; margin-right: 5px; }
      .card-footer { border-top: 1px solid #eee; background: #fafafa; padding: 8px 15px; display: flex; justify-content: flex-end; gap: 10px; }
      .card-btn { background: none; border: none; font-size: 13px; cursor: pointer; color: #555; }
      .card-btn:hover { color: #007bff; }
  
      footer { text-align: center; margin-top: 60px; padding: 20px; color: var(--text-color); opacity: 0.6; }
      footer a { color: var(--primary-color); text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
      footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
<div class="container">
<header>
  <h1>My Saved Links</h1>
  <div id="controls">
      <input type="text" id="searchBox" placeholder="Search by title or description...">
    </div>
    <div id="tags-container"></div>
</header>
<main id="links-container"></main>
<footer>
  <a href="${GITHUB_REPO_URL}" target="_blank" rel="noopener noreferrer">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
    </svg>
    View on GitHub
  </a>
</footer>
</div>

  <script>
  // --- Dark Mode Logic ---
        const theme = {
            init() {
                const savedTheme = localStorage.getItem('theme') || 'system';
                document.documentElement.setAttribute('data-theme', savedTheme);
                if (savedTheme === 'system') {
                    this.applySystemTheme();
                }
            },
            applySystemTheme() {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            }
        };
        theme.init();
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', theme.applySystemTheme);
    let allLinks = [];
    let activeTag = null;
    let secretToken = null;

    const getSecret = () => {
      if (!secretToken) {
        secretToken = prompt("Please enter your secret token:");
      }
      return secretToken;
    }

    const apiRequest = async (method, body) => {
      const secret = getSecret();
      if (!secret) return;
      try {
        const response = await fetch('/api/links', {
          method,
          headers: { 'Content-Type': 'application/json', 'X-Auth-Token': secret },
          body: JSON.stringify(body)
        });
        if (!response.ok) {
          alert('Operation failed: ' + await response.text());
          secretToken = null; // Clear token on failure
        } else {
          await fetchAndRenderAll();
        }
      } catch (error) {
        alert('An error occurred.');
      }
    };

    const handleEdit = (url) => {
      const link = allLinks.find(l => l.url === url);
      const newTitle = prompt("Enter new title:", link.title);
      const newDesc = prompt("Enter new description:", link.description);
      if (newTitle !== null && newDesc !== null) {
        apiRequest('PUT', { urlToUpdate: url, title: newTitle, description: newDesc });
      }
    };

    const handleDelete = (url) => {
      if (confirm("Are you sure you want to delete this link?")) {
        apiRequest('DELETE', { urlToDelete: url });
      }
    };
    
    const handleCopy = (url) => {
      navigator.clipboard.writeText(url).then(() => {
        alert("URL copied to clipboard!");
      }, () => {
        alert("Failed to copy URL.");
      });
    };

    const renderLinks = (linksToRender) => {
      const container = document.getElementById('links-container');
      container.innerHTML = '';
      if (linksToRender.length === 0) {
        container.innerHTML = '<p>No links found. Try a different search or save some new ones!</p>';
        return;
      }
      linksToRender.forEach(link => {
        const tagsHTML = (link.tags || []).map(tag => \`<span class="card-tag">\${tag}</span>\`).join('');
        const card = document.createElement('div');
        card.className = 'link-card';
        card.innerHTML = \`
          <a href="\${link.url}" target="_blank" rel="noopener noreferrer" class="main-link">
            <div class="content">
              <div class="title-wrapper">
                <img src="\${link.icon || ''}" alt="icon" onerror="">
                <h3>\${link.title}</h3>
              </div>
              <p>\${link.description || 'No description available.'}</p>
            </div>
          </a>
          <div class="card-tags">\${tagsHTML}</div>
          <div class="card-footer">
            <button class="card-btn" onclick="handleCopy('\${link.url}')">Copy URL</button>
            <button class="card-btn" onclick="handleEdit('\${link.url}')">Edit</button>
            <button class="card-btn" onclick="handleDelete('\${link.url}')">Delete</button>
          </div>
        \`;
        container.appendChild(card);
      });
    };

    const filterAndRender = () => {
      const searchTerm = document.getElementById('searchBox').value.toLowerCase();
      let filteredLinks = allLinks;

      if (activeTag) {
        filteredLinks = filteredLinks.filter(link => (link.tags || []).includes(activeTag));
      }
      
      if (searchTerm) {
        filteredLinks = filteredLinks.filter(link => 
          link.title.toLowerCase().includes(searchTerm) ||
          (link.description && link.description.toLowerCase().includes(searchTerm))
        );
      }
      
      renderLinks(filteredLinks);
    };

    const renderTags = () => {
      const allTags = new Set(allLinks.flatMap(link => link.tags || []));
      const container = document.getElementById('tags-container');
      container.innerHTML = '<span class="tag" data-tag="">All</span>';
      allTags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.dataset.tag = tag;
        tagEl.textContent = tag;
        container.appendChild(tagEl);
      });
      
      // Add click listeners
      container.querySelectorAll('.tag').forEach(tagEl => {
        tagEl.addEventListener('click', () => {
          container.querySelector('.tag.active')?.classList.remove('active');
          tagEl.classList.add('active');
          activeTag = tagEl.dataset.tag === '' ? null : tagEl.dataset.tag;
          filterAndRender();
        });
      });
      container.querySelector('.tag[data-tag=""]').classList.add('active');
    };

    const fetchAndRenderAll = async () => {
      try {
        const response = await fetch('/api/links');
        allLinks = await response.json();
        renderTags();
        filterAndRender();
      } catch (error) {
        document.getElementById('links-container').innerHTML = '<p>Failed to load links.</p>';
      }
    };
    
    document.getElementById('searchBox').addEventListener('input', filterAndRender);
    document.addEventListener('DOMContentLoaded', fetchAndRenderAll);
  </script>
</body>
</html>
      `;
      return new Response(html, { headers: { ...headers, 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    return new Response('404, Not Found!', { status: 404, headers });
  },
};

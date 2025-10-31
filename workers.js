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
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Saved Links</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 960px; margin: 40px auto; padding: 0 20px; background-color: #f7f7f7; }
    header { text-align: center; margin-bottom: 40px; }
    h1 { color: #1a1a1a; }
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
  </style>
</head>
<body>
  <header>
    <h1>My Saved Links</h1>
    <div id="controls">
      <input type="text" id="searchBox" placeholder="Search by title or description...">
    </div>
    <div id="tags-container"></div>
  </header>
  
  <div id="links-container"></div>

  <script>
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

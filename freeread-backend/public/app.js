(function () {
  const form = document.getElementById('form');
  const urlInput = document.getElementById('url');
  const submit = document.getElementById('submit');
  const statusEl = document.getElementById('status');
  const result = document.getElementById('result');
  const titleEl = document.getElementById('title');
  const metaEl = document.getElementById('meta');
  const contentEl = document.getElementById('content');

  function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('error', !!isError);
  }

  async function fetchArticle(u) {
    const res = await fetch('/api/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: u })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error((data && data.error && data.error.message) || 'Request failed');
    }
    return data;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = urlInput.value.trim();
    if (!u) { return; }
    result.hidden = true;
    setStatus('Fetching article…');
    submit.disabled = true;
    try {
      const data = await fetchArticle(u);
      titleEl.textContent = data.content.title || '(Untitled)';
      metaEl.textContent = `${new URL(u).hostname} • ${new Date(data.metadata.timestamp || Date.now()).toLocaleString()}`;
      contentEl.innerHTML = data.content.html || `<pre>${(data.content.text || '').slice(0, 2000)}</pre>`;
      result.hidden = false;
      setStatus(`Done (method: ${data.method})`);
    } catch (err) {
      setStatus(err.message || 'Failed to fetch article', true);
    } finally {
      submit.disabled = false;
    }
  });
})();



(function () {
  'use strict';

  const grid = document.getElementById('mediaGrid');
  const loadingEl = document.getElementById('mediaLoading');
  const emptyEl = document.getElementById('mediaEmpty');

  if (!grid) return;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(isoString) {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (_) {
      return '';
    }
  }

  function cardMarkup(item) {
    const typeLabel = item.type === 'podcast' ? 'Podcast' : 'Video';
    const title = escapeHtml(item.title);
    const url = escapeHtml(item.url);
    const desc = escapeHtml(item.description || '');
    const date = formatDate(item.date);
    const thumb = item.thumbnail ? escapeHtml(item.thumbnail) : 'drillmaster-card.png';
    const watchLabel = item.type === 'podcast' ? 'Listen' : 'Watch';

    return `
      <article class="media-card">
        <div class="media-thumb-wrap">
          <img class="media-thumb" src="${thumb}" alt="${title}" loading="lazy">
          <span class="media-pill">${typeLabel}</span>
        </div>
        <div class="media-card-body">
          <h2 class="media-title">${title}</h2>
          <p class="media-date">${date}</p>
          <p class="media-desc">${desc}</p>
          <div class="media-actions">
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">${watchLabel}</a>
          </div>
        </div>
      </article>
    `;
  }

  async function loadMedia() {
    try {
      const response = await fetch('/api/media');
      const data = await response.json();
      const media = Array.isArray(data.media) ? data.media : [];

      loadingEl.hidden = true;

      if (!media.length) {
        emptyEl.hidden = false;
        return;
      }

      grid.innerHTML = media.map(cardMarkup).join('');
    } catch (error) {
      loadingEl.hidden = true;
      emptyEl.hidden = false;
      emptyEl.textContent = 'Could not load media right now.';
      console.error('media load error:', error);
    }
  }

  loadMedia();
})();

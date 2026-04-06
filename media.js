(function () {
  'use strict';

  const grid = document.getElementById('mediaGrid');
  const loadingEl = document.getElementById('mediaLoading');
  const emptyEl = document.getElementById('mediaEmpty');
  const previewGrids = Array.from(document.querySelectorAll('[data-appearances-grid]'));
  const previewSection = document.querySelector('[data-appearances-section]');

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

  function truncate(str, maxLength) {
    const value = String(str || '').trim();
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1).trim()}…`;
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

  function previewCardMarkup(item) {
    const typeLabel = item.type === 'podcast' ? 'Podcast' : 'Video';
    const title = escapeHtml(item.title);
    const url = escapeHtml(item.url);
    const desc = escapeHtml(truncate(item.description || '', 110));
    const date = formatDate(item.date);
    const thumb = item.thumbnail ? escapeHtml(item.thumbnail) : 'drillmaster-card.png';
    const actionLabel = item.type === 'podcast' ? 'Listen' : 'Watch';

    return `
      <article class="appearance-card">
        <a class="appearance-card-link" href="${url}" target="_blank" rel="noopener noreferrer">
          <div class="appearance-thumb-wrap">
            <img class="appearance-thumb" src="${thumb}" alt="${title}" loading="lazy">
            <span class="appearance-pill">${typeLabel}</span>
          </div>
          <div class="appearance-body">
            <p class="appearance-date">${date}</p>
            <h3 class="appearance-title">${title}</h3>
            <p class="appearance-desc">${desc}</p>
            <span class="appearance-cta">${actionLabel} →</span>
          </div>
        </a>
      </article>
    `;
  }

  function renderPreviewSections(media) {
    if (!previewGrids.length) return;

    if (previewSection) {
      previewSection.hidden = false;
    }

    if (!media.length) {
      previewGrids.forEach((node) => {
        node.innerHTML = '<p class="appearance-empty">Fresh appearances will land here soon.</p>';
      });
      return;
    }

    previewGrids.forEach((node) => {
      const limit = Number(node.getAttribute('data-appearances-limit') || 3);
      node.innerHTML = media.slice(0, limit).map(previewCardMarkup).join('');
    });
  }

  async function loadMedia() {
    try {
      const response = await fetch('/api/media');
      const data = await response.json();
      const media = Array.isArray(data.media) ? data.media : [];

      renderPreviewSections(media);

      if (!grid) {
        return;
      }

      loadingEl.hidden = true;

      if (!media.length) {
        emptyEl.hidden = false;
        return;
      }

      grid.innerHTML = media.map(cardMarkup).join('');
    } catch (error) {
      if (grid) {
        loadingEl.hidden = true;
        emptyEl.hidden = false;
        emptyEl.textContent = 'Could not load media right now.';
      }

      previewGrids.forEach((node) => {
        node.innerHTML = '<p class="appearance-empty">Could not load recent appearances right now.</p>';
      });
      console.error('media load error:', error);
    }
  }

  if (grid || previewGrids.length) {
    loadMedia();
  }
})();

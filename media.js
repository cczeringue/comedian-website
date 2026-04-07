(function () {
  'use strict';

  const grid = document.getElementById('mediaGrid');
  const loadingEl = document.getElementById('mediaLoading');
  const emptyEl = document.getElementById('mediaEmpty');
  const previewGrids = Array.from(document.querySelectorAll('[data-appearances-grid]'));
  const previewSection = document.querySelector('[data-appearances-section]');
  const carousels = Array.from(document.querySelectorAll('[data-media-carousel]'));
  const carouselSections = Array.from(document.querySelectorAll('[data-carousel-section]'));

  const TRACK_ORDER = ['standup', 'drillmaster', 'luigi'];

  function normalizeTrack(item) {
    const t = String(item.track || '')
      .toLowerCase()
      .trim();
    if (TRACK_ORDER.includes(t)) return t;
    const hay = `${item.url || ''} ${item.title || ''}`.toLowerCase();
    if (hay.includes('luigithemusical')) return 'luigi';
    if (hay.includes('luigi') && (hay.includes('musical') || hay.includes('mangione'))) return 'luigi';
    if (hay.includes('drillmaster') || hay.includes('thedrillmaster')) return 'drillmaster';
    return 'standup';
  }

  function sortByDateDesc(media) {
    return [...media].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  function isFeaturedItem(item) {
    return item.featured === true || item.featured === 'true' || item.featured === 1 || item.featured === '1';
  }

  function carouselSourceMedia(root, sortedMedia) {
    if (root.getAttribute('data-carousel-featured-only') == null) {
      return sortedMedia;
    }
    const anyFeatured = sortedMedia.some(isFeaturedItem);
    if (!anyFeatured) {
      return sortedMedia;
    }
    return sortedMedia.filter(isFeaturedItem);
  }

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

  function carouselSlideMarkup(item) {
    return `<div class="media-carousel-slide">${previewCardMarkup(item)}</div>`;
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

  function initMediaCarousel(root, sortedMedia, anyFeaturedGlobal) {
    const limit = Number(root.dataset.carouselLimit || 12);
    const rail = root.querySelector('[data-carousel-rail]');
    const tabs = Array.from(root.querySelectorAll('[data-carousel-tab]'));
    const tablist = root.querySelector('[role="tablist"]');
    const panel = root.querySelector('[data-carousel-tabpanel]');

    if (!rail || !tabs.length) return;

    const byTrack = { standup: [], drillmaster: [], luigi: [] };
    sortedMedia.forEach((item) => {
      const t = normalizeTrack(item);
      if (byTrack[t]) byTrack[t].push(item);
    });

    let active =
      tabs.find((t) => t.getAttribute('aria-selected') === 'true')?.getAttribute('data-carousel-tab') || 'standup';

    const featuredOnly = root.getAttribute('data-carousel-featured-only') != null;

    function renderTrack(track) {
      const items = (byTrack[track] || []).slice(0, limit);
      if (!items.length) {
        const featuredHint =
          featuredOnly && anyFeaturedGlobal
            ? 'No featured clips in this tab. Mark items as featured in the <a href="/portal/add-media">media manager</a>, try another tab, or '
            : 'Nothing in this category yet. Try another tab or <a href="/portal/add-media">add media</a>. ';
        rail.innerHTML = `<p class="appearance-empty media-carousel-empty">${featuredHint}see <a href="/media">all media</a>.</p>`;
        return;
      }
      rail.innerHTML = items.map(carouselSlideMarkup).join('');
    }

    function activateTab(track) {
      if (!TRACK_ORDER.includes(track)) track = 'standup';
      active = track;
      tabs.forEach((btn) => {
        const isSel = btn.getAttribute('data-carousel-tab') === track;
        btn.setAttribute('aria-selected', String(isSel));
        btn.tabIndex = isSel ? 0 : -1;
      });
      if (panel) {
        const tabEl = tabs.find((b) => b.getAttribute('data-carousel-tab') === track);
        if (tabEl && tabEl.id) panel.setAttribute('aria-labelledby', tabEl.id);
      }
      rail.scrollLeft = 0;
      renderTrack(track);
    }

    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        activateTab(btn.getAttribute('data-carousel-tab'));
      });
    });

    if (tablist) {
      tablist.addEventListener('keydown', (e) => {
        const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
        if (!keys.includes(e.key)) return;
        e.preventDefault();
        const idx = TRACK_ORDER.indexOf(active);
        let next = idx;
        if (e.key === 'ArrowRight') next = Math.min(TRACK_ORDER.length - 1, idx + 1);
        if (e.key === 'ArrowLeft') next = Math.max(0, idx - 1);
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = TRACK_ORDER.length - 1;
        const nextTrack = TRACK_ORDER[next];
        const nextBtn = tabs.find((t) => t.getAttribute('data-carousel-tab') === nextTrack);
        if (nextBtn) {
          nextBtn.focus();
          activateTab(nextTrack);
        }
      });
    }

    activateTab(active);
  }

  function setCarouselError(message) {
    carousels.forEach((root) => {
      const rail = root.querySelector('[data-carousel-rail]');
      if (rail) {
        rail.innerHTML = `<p class="appearance-empty">${escapeHtml(message)}</p>`;
      }
      root.querySelectorAll('[data-carousel-tab]').forEach((t) => {
        t.disabled = true;
      });
    });
  }

  function revealCarouselSections() {
    carouselSections.forEach((el) => {
      el.hidden = false;
    });
  }

  async function fetchMediaList() {
    const parseApiResponse = async (response) => {
      const ct = (response.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('json')) {
        await response.text();
        throw new Error('API response was not JSON (often a 404 HTML page — is this a static-only host?)');
      }
      return response.json();
    };

    const fromApi = async () => {
      const response = await fetch('/api/media');
      if (!response.ok) {
        throw new Error(`API HTTP ${response.status}`);
      }
      const data = await parseApiResponse(response);
      return Array.isArray(data.media) ? data.media : [];
    };

    const fromStaticFallback = async () => {
      const response = await fetch('/data/media.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`static media.json HTTP ${response.status}`);
      }
      const ct = (response.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('json')) {
        throw new Error('media.json was not JSON');
      }
      const data = await response.json();
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.media)) return data.media;
      return [];
    };

    try {
      return await fromApi();
    } catch (primaryErr) {
      console.warn('media.js: /api/media unavailable, trying /data/media.json', primaryErr);
      return await fromStaticFallback();
    }
  }

  async function loadMedia() {
    try {
      const media = await fetchMediaList();
      const sorted = sortByDateDesc(media);

      renderPreviewSections(sorted);

      if (carousels.length) {
        revealCarouselSections();
        const anyFeaturedGlobal = sorted.some(isFeaturedItem);
        carousels.forEach((root) =>
          initMediaCarousel(root, carouselSourceMedia(root, sorted), anyFeaturedGlobal)
        );
      }

      if (!grid) {
        return;
      }

      loadingEl.hidden = true;

      if (!sorted.length) {
        emptyEl.hidden = false;
        return;
      }

      grid.innerHTML = sorted.map(cardMarkup).join('');
    } catch (error) {
      if (grid) {
        loadingEl.hidden = true;
        emptyEl.hidden = false;
        emptyEl.textContent = 'Could not load media right now.';
      }

      previewGrids.forEach((node) => {
        node.innerHTML = '<p class="appearance-empty">Could not load recent appearances right now.</p>';
      });

      if (carousels.length) {
        revealCarouselSections();
        setCarouselError('Could not load media right now.');
      }

      console.error(
        'media load error:',
        error,
        '— Open the site over HTTP with API routes (e.g. vercel dev / production), or ensure /data/media.json is deployed for a static fallback.'
      );
    }
  }

  if (grid || previewGrids.length || carousels.length) {
    loadMedia();
  }
})();

(function () {
  'use strict';

  /* ── selectors ── */
  const previewGrids = Array.from(document.querySelectorAll('[data-appearances-grid]'));
  const previewSection = document.querySelector('[data-appearances-section]');
  const carousels = Array.from(document.querySelectorAll('[data-media-carousel]'));
  const carouselSections = Array.from(document.querySelectorAll('[data-carousel-section]'));
  const pressGridSection = document.querySelector('[data-press-grid-section]');
  const mediaPageSection = document.querySelector('[data-media-page-section]');

  /* ── constants ── */
  const CAROUSEL_TRACKS = ['standup', 'drillmaster', 'luigi'];
  const PRESS_TRACKS = ['all', 'standup', 'drillmaster', 'luigi'];

  /* ── helpers ── */
  function normalizeTrack(item) {
    const t = String(item.track || '').toLowerCase().trim();
    if (CAROUSEL_TRACKS.includes(t)) return t;
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
    if (root.getAttribute('data-carousel-featured-only') == null) return sortedMedia;
    const anyFeatured = sortedMedia.some(isFeaturedItem);
    if (!anyFeatured) return sortedMedia;
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
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (_) { return ''; }
  }

  function truncate(str, maxLength) {
    const v = String(str || '').trim();
    return v.length <= maxLength ? v : `${v.slice(0, maxLength - 1).trim()}…`;
  }

  function normalizeUrl(u) {
    try {
      const p = new URL(u);
      p.searchParams.delete('si');
      p.searchParams.delete('lang');
      return p.href.replace(/\/+$/, '');
    } catch (_) { return String(u || '').replace(/\/+$/, ''); }
  }

  const PRESS_KINDS = ['article', 'audio', 'podcast'];

  function normalizePressKind(entry) {
    const k = String(entry && entry.kind || '').toLowerCase().trim();
    if (PRESS_KINDS.includes(k)) return k;
    const b = String(entry && entry.badge || '').toUpperCase();
    if (b === 'PODCAST') return 'podcast';
    if (b === 'VIDEO') return 'article';
    return 'article';
  }

  function pressKindLabel(kind) {
    const k = PRESS_KINDS.includes(kind) ? kind : 'article';
    return k.charAt(0).toUpperCase() + k.slice(1);
  }

  function ctaForPressKind(kind) {
    return kind === 'article' ? 'Read' : 'Listen';
  }

  function pressKindForGalleryItem(item) {
    return item.type === 'podcast' ? 'podcast' : 'audio';
  }

  /* ── card templates ── */
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
      </article>`;
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
      </article>`;
  }

  function carouselSlideMarkup(item) {
    return `<div class="media-carousel-slide">${previewCardMarkup(item)}</div>`;
  }

  function pressCardMarkup(item) {
    const kind = PRESS_KINDS.includes(item._pressKind) ? item._pressKind : 'article';
    const typePill = escapeHtml(pressKindLabel(kind));
    const title = escapeHtml(item.title || 'Untitled');
    const url = escapeHtml(item.url);
    const desc = escapeHtml(truncate(item.description || '', 120));
    const date = item.date ? formatDate(item.date) : '';
    const source = item._source ? escapeHtml(item._source) : '';
    const thumb = item.thumbnail ? escapeHtml(item.thumbnail) : '';
    const thumbHtml = thumb
      ? `<img class="press-card-thumb" src="${thumb}" alt="${title}" loading="lazy">`
      : `<div class="press-card-thumb-placeholder"></div>`;
    const ctaLabel = ctaForPressKind(kind);
    const featuredPill = item._showFeaturedBadge
      ? '<span class="appearance-pill appearance-pill--featured">Featured</span>'
      : '';

    return `
      <article class="press-media-card">
        <a class="press-media-card-link" href="${url}" target="_blank" rel="noopener noreferrer">
          <div class="press-card-thumb-wrap">
            ${thumbHtml}
            <div class="press-card-badges">
              <span class="appearance-pill">${typePill}</span>
              ${featuredPill}
            </div>
          </div>
          <div class="press-card-body">
            ${source ? `<p class="press-card-source">${source}</p>` : ''}
            ${date ? `<p class="appearance-date">${date}</p>` : ''}
            <h3 class="press-card-title">${title}</h3>
            <p class="press-card-desc">${desc}</p>
            <span class="appearance-cta">${ctaLabel} →</span>
          </div>
        </a>
      </article>`;
  }

  /* ── preview sections (links page) ── */
  function renderPreviewSections(media) {
    if (!previewGrids.length) return;
    if (previewSection) previewSection.hidden = false;
    if (!media.length) {
      previewGrids.forEach((n) => {
        n.innerHTML = '<p class="appearance-empty">Fresh appearances will land here soon.</p>';
      });
      return;
    }
    previewGrids.forEach((n) => {
      const limit = Number(n.getAttribute('data-appearances-limit') || 3);
      n.innerHTML = media.slice(0, limit).map(previewCardMarkup).join('');
    });
  }

  /* ── carousel (links page) ── */
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

    let active = tabs.find((t) => t.getAttribute('aria-selected') === 'true')?.getAttribute('data-carousel-tab') || 'standup';
    const featuredOnly = root.getAttribute('data-carousel-featured-only') != null;

    function renderTrack(track) {
      const items = (byTrack[track] || []).slice(0, limit);
      if (!items.length) {
        const hint = featuredOnly && anyFeaturedGlobal
          ? 'No featured clips in this tab. Mark items as featured in the <a href="portal/add-media.html">media manager</a>, try another tab, or '
          : 'Nothing in this category yet. Try another tab or <a href="portal/add-media.html">add media</a>. ';
        rail.innerHTML = `<p class="appearance-empty media-carousel-empty">${hint}see <a href="media.html">all media</a>.</p>`;
        return;
      }
      rail.innerHTML = items.map(carouselSlideMarkup).join('');
    }

    function activateTab(track) {
      if (!CAROUSEL_TRACKS.includes(track)) track = 'standup';
      active = track;
      tabs.forEach((b) => {
        const sel = b.getAttribute('data-carousel-tab') === track;
        b.setAttribute('aria-selected', String(sel));
        b.tabIndex = sel ? 0 : -1;
      });
      if (panel) {
        const el = tabs.find((b) => b.getAttribute('data-carousel-tab') === track);
        if (el && el.id) panel.setAttribute('aria-labelledby', el.id);
      }
      rail.scrollLeft = 0;
      renderTrack(track);
    }

    tabs.forEach((b) => b.addEventListener('click', () => activateTab(b.getAttribute('data-carousel-tab'))));
    if (tablist) {
      tablist.addEventListener('keydown', (e) => {
        const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
        if (!keys.includes(e.key)) return;
        e.preventDefault();
        const idx = CAROUSEL_TRACKS.indexOf(active);
        let next = idx;
        if (e.key === 'ArrowRight') next = Math.min(CAROUSEL_TRACKS.length - 1, idx + 1);
        if (e.key === 'ArrowLeft') next = Math.max(0, idx - 1);
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = CAROUSEL_TRACKS.length - 1;
        const nTrack = CAROUSEL_TRACKS[next];
        const nBtn = tabs.find((t) => t.getAttribute('data-carousel-tab') === nTrack);
        if (nBtn) { nBtn.focus(); activateTab(nTrack); }
      });
    }
    activateTab(active);
  }

  function setCarouselError(message) {
    carousels.forEach((root) => {
      const rail = root.querySelector('[data-carousel-rail]');
      if (rail) rail.innerHTML = `<p class="appearance-empty">${escapeHtml(message)}</p>`;
      root.querySelectorAll('[data-carousel-tab]').forEach((t) => { t.disabled = true; });
    });
  }

  function revealCarouselSections() {
    carouselSections.forEach((el) => { el.hidden = false; });
  }

  /* ── press grid (homepage) ── */
  async function fetchPressConfig() {
    try {
      const res = await fetch('/data/press-grid.json', { cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (_) { return []; }
  }

  async function unfurlUrl(url) {
    try {
      const res = await fetch(`/api/unfurl?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (_) { return null; }
  }

  function normalizeMediaPagePin(entry) {
    const p = entry && entry.mediaPagePin;
    if (p === 0) return 0;
    if (typeof p === 'number' && Number.isFinite(p) && p >= 0) return p;
    return null;
  }

  function mergePressAndMedia(pressEntries, galleryMedia) {
    const urlIndex = new Map();
    galleryMedia.forEach((item) => { urlIndex.set(normalizeUrl(item.url), item); });

    const usedUrls = new Set();
    const merged = [];

    pressEntries.forEach((entry, pressIndex) => {
      const nUrl = normalizeUrl(entry.url);
      const galleryItem = urlIndex.get(nUrl);
      const tracks = Array.isArray(entry.tracks) && entry.tracks.length ? entry.tracks : ['all'];
      const pressKind = normalizePressKind(entry);

      const configThumb = entry.thumbnail || '';

      const pagePin = normalizeMediaPagePin(entry);

      if (galleryItem) {
        merged.push({
          ...galleryItem,
          _pressKind: pressKind,
          _pressOrder: pressIndex,
          _mediaPagePin: pagePin,
          _showFeaturedBadge: !!entry.featuredBadge,
          _source: entry.source || '',
          _tracks: tracks,
          _curated: true,
          _featured: !!(entry.featured),
          title: galleryItem.title && galleryItem.title !== 'Untitled appearance' ? galleryItem.title : entry.title,
          description: galleryItem.description || entry.description,
          thumbnail: galleryItem.thumbnail || configThumb,
          date: entry.date || galleryItem.date || ''
        });
      } else {
        merged.push({
          url: entry.url,
          title: entry.title || '',
          description: entry.description || '',
          thumbnail: configThumb,
          date: entry.date || '',
          type: pressKind === 'podcast' ? 'podcast' : 'video',
          track: tracks[0] === 'all' ? 'standup' : tracks[0],
          _pressKind: pressKind,
          _pressOrder: pressIndex,
          _mediaPagePin: pagePin,
          _showFeaturedBadge: !!entry.featuredBadge,
          _source: entry.source || '',
          _tracks: tracks,
          _curated: true,
          _featured: !!(entry.featured),
          _needsUnfurl: !configThumb
        });
      }
      usedUrls.add(nUrl);
    });

    let galleryPressOrder = 0;
    galleryMedia.forEach((item) => {
      if (!usedUrls.has(normalizeUrl(item.url)) && isFeaturedItem(item)) {
        const gKind = pressKindForGalleryItem(item);
        merged.push({
          ...item,
          _pressKind: gKind,
          _pressOrder: 1000 + galleryPressOrder,
          _mediaPagePin: null,
          _showFeaturedBadge: false,
          _source: '',
          _tracks: [normalizeTrack(item)],
          _curated: false,
          _featured: true
        });
        galleryPressOrder += 1;
      }
    });

    return merged;
  }

  function filterPressItems(items, track) {
    if (track === 'all') return items;
    return items.filter((item) => {
      if (item._tracks && item._tracks.includes(track)) return true;
      if (item._tracks && item._tracks.includes('all') && !item._curated) return false;
      return normalizeTrack(item) === track;
    });
  }

  function initPressGrid(section, galleryMedia, opts) {
    const gridEl = section.querySelector('[data-press-media-grid]');
    const tabs = Array.from(section.querySelectorAll('[data-press-tab]'));
    const tablist = section.querySelector('[role="tablist"]');
    const panel = section.querySelector('[role="tabpanel"]');
    if (!gridEl) return;

    let mergedItems = [];
    let active = 'all';

    const PRESS_GRID_LIMIT = (opts && opts.limit) || Infinity;
    const sortDateFirst = !!(opts && opts.sortDateFirst);

    function parseItemDateMs(item) {
      if (!item || item.date == null) return null;
      const s = String(item.date).trim();
      if (!s) return null;
      const t = new Date(s).getTime();
      if (!Number.isFinite(t)) return null;
      return t;
    }

    function mediaPagePinKey(item) {
      const p = item._mediaPagePin;
      if (p === 0) return 0;
      if (typeof p === 'number' && Number.isFinite(p) && p >= 0) return p;
      return 100000;
    }

    function rankItems(items) {
      return [...items].sort((a, b) => {
        if (sortDateFirst) {
          const pa = mediaPagePinKey(a);
          const pb = mediaPagePinKey(b);
          if (pa !== pb) return pa - pb;
          const ta = parseItemDateMs(a);
          const tb = parseItemDateMs(b);
          if (ta != null && tb != null && ta !== tb) return tb - ta;
          if (ta != null && tb == null) return -1;
          if (ta == null && tb != null) return 1;
          const ao = Number.isFinite(a._pressOrder) ? a._pressOrder : -1;
          const bo = Number.isFinite(b._pressOrder) ? b._pressOrder : -1;
          if (ao !== bo) return bo - ao;
          return String(b.url || '').localeCompare(String(a.url || ''));
        }
        const ao = Number.isFinite(a._pressOrder) ? a._pressOrder : 9999;
        const bo = Number.isFinite(b._pressOrder) ? b._pressOrder : 9999;
        if (ao !== bo) return ao - bo;
        return (new Date(b.date || 0).getTime()) - (new Date(a.date || 0).getTime());
      });
    }

    function render(track) {
      const filtered = filterPressItems(mergedItems, track);
      const ranked = rankItems(filtered).slice(0, PRESS_GRID_LIMIT);
      if (!ranked.length) {
        gridEl.innerHTML = '<p class="appearance-empty">Nothing in this category yet.</p>';
        return;
      }
      gridEl.innerHTML = ranked.map(pressCardMarkup).join('');
    }

    function activateTab(track) {
      if (!PRESS_TRACKS.includes(track)) track = 'all';
      active = track;
      tabs.forEach((b) => {
        const sel = b.getAttribute('data-press-tab') === track;
        b.setAttribute('aria-selected', String(sel));
        b.tabIndex = sel ? 0 : -1;
      });
      if (panel) {
        const el = tabs.find((b) => b.getAttribute('data-press-tab') === track);
        if (el && el.id) panel.setAttribute('aria-labelledby', el.id);
      }
      render(track);
    }

    tabs.forEach((b) => b.addEventListener('click', () => activateTab(b.getAttribute('data-press-tab'))));
    if (tablist) {
      tablist.addEventListener('keydown', (e) => {
        const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
        if (!keys.includes(e.key)) return;
        e.preventDefault();
        const idx = PRESS_TRACKS.indexOf(active);
        let next = idx;
        if (e.key === 'ArrowRight') next = Math.min(PRESS_TRACKS.length - 1, idx + 1);
        if (e.key === 'ArrowLeft') next = Math.max(0, idx - 1);
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = PRESS_TRACKS.length - 1;
        const nTrack = PRESS_TRACKS[next];
        const nBtn = tabs.find((t) => t.getAttribute('data-press-tab') === nTrack);
        if (nBtn) { nBtn.focus(); activateTab(nTrack); }
      });
    }

    return async function hydrate(pressConfig) {
      mergedItems = mergePressAndMedia(pressConfig, galleryMedia);
      activateTab(active);

      const needUnfurl = mergedItems.filter((i) => i._needsUnfurl);
      if (!needUnfurl.length) return;

      await Promise.allSettled(
        needUnfurl.map(async (item) => {
          const data = await unfurlUrl(item.url);
          if (!data) return;
          if (data.title && !item.title) item.title = data.title;
          if (data.image && !item.thumbnail) item.thumbnail = data.image;
          if (data.description && !item.description) item.description = data.description;
          item._needsUnfurl = false;
        })
      );
      render(active);
    };
  }

  /* ── data fetching ── */
  async function fetchMediaList() {
    const parseApiResponse = async (response) => {
      const ct = (response.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('json')) {
        await response.text();
        throw new Error('API response was not JSON');
      }
      return response.json();
    };

    const fromApi = async () => {
      const response = await fetch('/api/media', { cache: 'no-store' });
      if (!response.ok) throw new Error(`API HTTP ${response.status}`);
      const data = await parseApiResponse(response);
      return Array.isArray(data.media) ? data.media : [];
    };

    const fromStaticFallback = async () => {
      const response = await fetch('/data/media.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`static media.json HTTP ${response.status}`);
      const ct = (response.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('json')) throw new Error('media.json was not JSON');
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

  /* ── main ── */
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

      const pressConfig = await fetchPressConfig();

      if (pressGridSection) {
        const hydrate = initPressGrid(pressGridSection, sorted, { limit: 3 });
        if (hydrate) await hydrate(pressConfig);
      }

      if (mediaPageSection) {
        const hydrate = initPressGrid(mediaPageSection, sorted, { limit: Infinity, sortDateFirst: true });
        if (hydrate) await hydrate(pressConfig);
      }
    } catch (error) {
      previewGrids.forEach((n) => {
        n.innerHTML = '<p class="appearance-empty">Could not load recent appearances right now.</p>';
      });
      if (carousels.length) { revealCarouselSections(); setCarouselError('Could not load media right now.'); }
      [pressGridSection, mediaPageSection].forEach((s) => {
        if (!s) return;
        const g = s.querySelector('[data-press-media-grid]');
        if (g) g.innerHTML = '<p class="appearance-empty">Could not load media right now.</p>';
      });
      console.error('media load error:', error);
    }
  }

  if (previewGrids.length || carousels.length || pressGridSection || mediaPageSection) {
    loadMedia();
  }
})();

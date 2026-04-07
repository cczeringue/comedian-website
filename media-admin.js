(function () {
  'use strict';

  const STORAGE_KEY = 'mediaAdminKey';
  const urlParams = new URLSearchParams(window.location.search);
  const queryKey = urlParams.get('key');

  const lockScreen = document.getElementById('lockScreen');
  const managerPanel = document.getElementById('managerPanel');
  const adminKeyInput = document.getElementById('adminKeyInput');
  const unlockBtn = document.getElementById('unlockBtn');
  const lockStatus = document.getElementById('lockStatus');

  const urlInput = document.getElementById('mediaUrlInput');
  const fetchBtn = document.getElementById('fetchBtn');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const managerStatus = document.getElementById('managerStatus');

  const previewCard = document.getElementById('previewCard');
  const previewThumb = document.getElementById('previewThumb');
  const previewMeta = document.getElementById('previewMeta');
  const editTitle = document.getElementById('editTitle');
  const editDesc = document.getElementById('editDesc');
  const editFeatured = document.getElementById('editFeatured');

  let draftMedia = null;

  function inferTrackFromDraft(item) {
    const hay = `${item.url || ''} ${item.title || ''}`.toLowerCase();
    if (hay.includes('luigithemusical')) return 'luigi';
    if (hay.includes('luigi') && (hay.includes('musical') || hay.includes('mangione'))) return 'luigi';
    if (hay.includes('drillmaster') || hay.includes('thedrillmaster')) return 'drillmaster';
    return 'standup';
  }

  function setTrackRadios(track) {
    const allowed = ['standup', 'drillmaster', 'luigi'];
    const value = allowed.includes(track) ? track : 'standup';
    document.querySelectorAll('input[name="mediaTrack"]').forEach((input) => {
      input.checked = input.value === value;
    });
  }

  function getSelectedTrack() {
    const checked = document.querySelector('input[name="mediaTrack"]:checked');
    return checked ? checked.value : 'standup';
  }

  function getAdminKey() {
    return sessionStorage.getItem(STORAGE_KEY) || '';
  }

  function setAdminKey(value) {
    sessionStorage.setItem(STORAGE_KEY, value);
  }

  function setStatus(el, message, mode) {
    el.hidden = false;
    el.className = `admin-status ${mode || ''}`.trim();
    el.textContent = message;
  }

  function clearStatus(el) {
    el.hidden = true;
    el.className = 'admin-status';
    el.textContent = '';
  }

  function unlockUi() {
    lockScreen.hidden = true;
    managerPanel.hidden = false;
  }

  function lockUi() {
    lockScreen.hidden = false;
    managerPanel.hidden = true;
  }

  function setPreview(item) {
    previewCard.hidden = false;
    previewThumb.src = item.thumbnail || '../drillmaster-card.png';
    previewThumb.alt = item.title || 'Media thumbnail';
    editTitle.value = item.title || '';
    editDesc.value = item.description || '';
    editFeatured.checked = false;
    previewMeta.textContent = `${(item.type || 'video').toUpperCase()} • ${new Date(item.date).toLocaleString()}`;
  }

  function resetDraft() {
    draftMedia = null;
    previewCard.hidden = true;
    saveBtn.disabled = true;
    editTitle.value = '';
    editDesc.value = '';
    editFeatured.checked = false;
  }

  async function handleFetch() {
    clearStatus(managerStatus);
    const url = (urlInput.value || '').trim();
    if (!url) {
      setStatus(managerStatus, 'Paste a valid URL first.', 'error');
      return;
    }

    fetchBtn.disabled = true;
    fetchBtn.textContent = 'Fetching...';
    try {
      const response = await fetch('/api/fetch-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminKey()}`
        },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not fetch metadata');
      }
      draftMedia = data.media;
      setPreview(draftMedia);
      setTrackRadios(inferTrackFromDraft(draftMedia));
      saveBtn.disabled = false;
      setStatus(managerStatus, 'Metadata loaded. Review and click Save.', 'success');
    } catch (error) {
      setStatus(managerStatus, error.message || 'Metadata fetch failed.', 'error');
      resetDraft();
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.textContent = 'Fetch Metadata';
    }
  }

  async function handleSave() {
    clearStatus(managerStatus);
    if (!draftMedia) {
      setStatus(managerStatus, 'Fetch metadata before saving.', 'error');
      return;
    }

    const adminKey = getAdminKey();
    if (!adminKey) {
      setStatus(managerStatus, 'Session key missing. Re-unlock this portal.', 'error');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    try {
      const response = await fetch('/api/add-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminKey}`
        },
        body: JSON.stringify({
          ...draftMedia,
          title: (editTitle.value || '').trim() || draftMedia.title || 'Untitled appearance',
          description: (editDesc.value || '').trim(),
          track: getSelectedTrack(),
          featured: editFeatured.checked
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details ? `${data.error} ${data.details}` : (data.error || 'Save failed'));
      }
      setStatus(managerStatus, 'Saved. Your /media gallery is now updated.', 'success');
      urlInput.value = '';
      resetDraft();
    } catch (error) {
      setStatus(managerStatus, error.message || 'Save failed', 'error');
    } finally {
      saveBtn.disabled = !draftMedia;
      saveBtn.textContent = 'Save to Gallery';
    }
  }

  async function handleUnlock() {
    clearStatus(lockStatus);
    const key = (adminKeyInput.value || '').trim();
    if (!key) {
      setStatus(lockStatus, 'Enter your admin key.', 'error');
      return;
    }

    unlockBtn.disabled = true;
    unlockBtn.textContent = 'Checking...';
    try {
      // We store it and trust API to enforce authorization on write.
      setAdminKey(key);
      unlockUi();
      clearStatus(lockStatus);
    } finally {
      unlockBtn.disabled = false;
      unlockBtn.textContent = 'Unlock';
    }
  }

  function boot() {
    if (queryKey) {
      setAdminKey(queryKey);
    }

    if (getAdminKey()) {
      unlockUi();
    } else {
      lockUi();
    }

    unlockBtn.addEventListener('click', handleUnlock);
    fetchBtn.addEventListener('click', handleFetch);
    saveBtn.addEventListener('click', handleSave);
    clearBtn.addEventListener('click', function () {
      clearStatus(managerStatus);
      urlInput.value = '';
      resetDraft();
    });

    if (editTitle) {
      editTitle.addEventListener('input', function () {
        previewThumb.alt = editTitle.value.trim() || 'Media thumbnail';
      });
    }
  }

  boot();
})();

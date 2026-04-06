/**
 * Links page — "Next up" shows only (max 2), parsed from the Seated widget DOM.
 * Full calendar stays in the Seated embed below (no duplicate list).
 */
(function () {
  'use strict';

  var SEATED_ROOT_ID = 'seated-55fdf2c0';
  var MAX_PREVIEW_SHOWS = 2;

  var dateRegexShort = /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\s+\d{1,2},?\s+\d{4}/i;
  var dateRegexLong =
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i;
  var timeRegex = /\b(\d{1,2}(:\d{2})?\s?(AM|PM))(\s*\/\s*\d{1,2}(:\d{2})?\s?(AM|PM))?\b/i;
  var cityStateRegex = /[A-Za-z.\-'\s]+,\s?[A-Z]{2}\b/;

  var MONTH_MAP = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    SEPT: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11
  };

  var LONG_MONTHS = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11
  };

  function isDateLine(text) {
    return dateRegexShort.test(text) || dateRegexLong.test(text);
  }
  function isActionLine(text) {
    return /tickets|rsvp|pending|show more|show less|powered by seated/i.test(text);
  }
  function isJsonNoise(text) {
    return /@context|schema\.org|\"@type\"|\"startDate\"|\"endDate\"|\"offers\"|imgix\.net/i.test(text);
  }

  function splitCombinedLine(line) {
    var working = line.trim();
    var dateMatch = working.match(dateRegexShort) || working.match(dateRegexLong);
    var timeMatch = working.match(timeRegex);
    var cityMatch = working.match(cityStateRegex);

    var date = '';
    var timeLine = '';
    var cityLine = '';
    var venueLine = working;

    if (dateMatch) {
      date = dateMatch[0].trim();
      venueLine = venueLine.replace(dateMatch[0], '').trim();
    }
    if (timeMatch) {
      timeLine = timeMatch[0].trim();
      venueLine = venueLine.replace(timeMatch[0], '').trim();
    }
    if (cityMatch) {
      cityLine = cityMatch[0].trim();
      venueLine = venueLine.replace(cityMatch[0], '').trim();
    }

    venueLine = venueLine.replace(/[·•\-–—]+/g, ' ').replace(/\s+/g, ' ').trim();

    return { date: date, timeLine: timeLine, cityLine: cityLine, venueLine: venueLine };
  }

  /** Seated sometimes concatenates fields with no spaces — split for parsing */
  function normalizeRunTogether(str) {
    if (!str) return '';
    var s = String(str).replace(/\s+/g, ' ').trim();
    s = s.replace(/(\d{4})([A-Za-z])/g, '$1 $2');
    s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
    s = s.replace(/(,)([A-Za-z])/g, '$1 $2');
    s = s.replace(/\b([A-Z]{2})(Bits|THE|Coming|Flappers|Thorough)/g, '$1 $2');
    return s.replace(/\s+/g, ' ').trim();
  }

  function getCleanLines(row) {
    var clone = row.cloneNode(true);
    clone.querySelectorAll('script, style, noscript').forEach(function (el) {
      el.remove();
    });
    var rawLines = (clone.innerText || '')
      .split('\n')
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean);
    if (rawLines.some(isJsonNoise)) return [];
    return rawLines;
  }

  function findRowWithDate(startEl, root) {
    var node = startEl;
    while (node && node !== root) {
      var text = (node.textContent || '').trim();
      if (isDateLine(text)) return node;
      node = node.parentElement;
    }
    return startEl.closest('li, tr') || startEl.parentElement;
  }

  var TICKET_HOST_RE =
    /seated\.com|partiful\.com|eventbrite|dice\.fm|showclix|tix\.com|ticketfly|axs\.com|universe\.com|posh\.vu|ludus\.com|brownpapertickets|prekindle/i;

  function isUsefulHref(href) {
    if (!href) return false;
    var t = String(href).trim();
    if (t === '#' || t === '/#' || /^javascript:/i.test(t)) return false;
    if (/^mailto:/i.test(t) || /^tel:/i.test(t)) return false;
    return true;
  }

  function absolutizeHref(href) {
    if (!href) return '';
    var h = String(href).trim();
    if (/^https?:\/\//i.test(h)) return h;
    if (h.startsWith('//')) {
      var proto =
        typeof window !== 'undefined' && window.location && window.location.protocol
          ? window.location.protocol
          : 'https:';
      return proto + h;
    }
    var bases = [
      'https://www.seated.com/',
      'https://tours.seated.com/',
      'https://app.seated.com/',
      'https://events.seated.com/'
    ];
    for (var b = 0; b < bases.length; b++) {
      try {
        return new URL(h, bases[b]).href;
      } catch (e) {}
    }
    return h;
  }

  /** Seated / web components may put <a> inside open shadow roots */
  function queryAnchorsInRow(row) {
    if (!row) return [];
    var list = Array.from(row.querySelectorAll('a[href]'));
    try {
      row.querySelectorAll('*').forEach(function (el) {
        if (el.shadowRoot) {
          list.push.apply(list, el.shadowRoot.querySelectorAll('a[href]'));
        }
      });
    } catch (e) {}
    return list;
  }

  function scoreTicketAnchor(a) {
    if (!a || !a.getAttribute) return -1;
    var raw = a.getAttribute('href') || '';
    if (!isUsefulHref(raw)) return -1;
    var abs;
    try {
      abs = absolutizeHref(raw);
    } catch (x) {
      return -1;
    }
    if (!/^https?:\/\//i.test(abs)) return -1;
    var lc = abs.toLowerCase();
    var text = (
      (a.getAttribute('aria-label') || '') +
      ' ' +
      (a.textContent || '')
    ).toLowerCase();
    var s = 1;
    if (/ticket|rsvp|buy|register|get tickets|reserve/.test(text)) s += 20;
    if (TICKET_HOST_RE.test(lc)) s += 25;
    if (/seated\.com\/(e\/|events\/|o\/)/.test(lc)) s += 12;
    return s;
  }

  /** Best ticket / RSVP URL inside this event row */
  function findTicketHrefInRow(row, actionEl) {
    if (!row) return '';

    var best = '';
    var bestScore = -1;

    function considerAnchor(a) {
      if (!a) return;
      var sc = scoreTicketAnchor(a);
      if (sc > bestScore) {
        bestScore = sc;
        best = absolutizeHref(a.getAttribute('href'));
      }
    }

    queryAnchorsInRow(row).forEach(considerAnchor);

    if (actionEl) {
      if (actionEl.tagName === 'A') considerAnchor(actionEl);
      var wrapA = actionEl.closest && actionEl.closest('a[href]');
      if (wrapA && wrapA !== actionEl) considerAnchor(wrapA);
      var ds =
        actionEl.getAttribute &&
        (actionEl.getAttribute('data-url') ||
          actionEl.getAttribute('data-href') ||
          (actionEl.dataset && (actionEl.dataset.url || actionEl.dataset.href)));
      if (ds && isUsefulHref(ds)) {
        var absDs = absolutizeHref(ds);
        var dsScore = 32;
        if (/^https?:\/\//i.test(absDs) && dsScore > bestScore) {
          best = absDs;
          bestScore = dsScore;
        }
      }
    }

    if (best) return best;

    var fallback = '';
    queryAnchorsInRow(row).forEach(function (a) {
      var h = a.getAttribute('href');
      if (h && /^https?:\/\//i.test(absolutizeHref(h))) fallback = absolutizeHref(h);
    });
    return fallback || '';
  }

  function extractUrlFromOnclick(el) {
    var oc = el.getAttribute && el.getAttribute('onclick');
    if (!oc) return '';
    var m = String(oc).match(/https?:\/\/[^\s'"`)]+/);
    if (!m) return '';
    return m[0].replace(/[);,'\]}]+$/, '');
  }

  /** Any plausible ticket URL in the row (resolved <a>.href, onclick, data-*). */
  function findBestTicketUrlFromRow(row) {
    if (!row) return '';
    var candidates = [];

    queryAnchorsInRow(row).forEach(function (a) {
      var attr = (a.getAttribute('href') || '').trim();
      if (!attr || attr === '#' || /^javascript:/i.test(attr)) return;
      try {
        var full = String(a.href || '');
        if (!/^https?:\/\//i.test(full)) return;
        var score = 0;
        if (TICKET_HOST_RE.test(full)) score += 25;
        if (/seated\.com\/(e\/|events\/|o\/)/i.test(full)) score += 15;
        var label = ((a.getAttribute('aria-label') || '') + ' ' + (a.textContent || '')).toLowerCase();
        if (/ticket|rsvp|buy|register|get tickets|reserve/.test(label)) score += 18;
        candidates.push({ url: full, score: score });
      } catch (e) {}
    });

    row.querySelectorAll('[onclick]').forEach(function (el) {
      var u = extractUrlFromOnclick(el);
      if (u && /^https?:\/\//i.test(u)) {
        candidates.push({ url: u, score: TICKET_HOST_RE.test(u) ? 22 : 8 });
      }
    });

    row
      .querySelectorAll('[data-url],[data-href],[data-link],[data-ticket-url],[data-href-url]')
      .forEach(function (el) {
        ['data-url', 'data-href', 'data-link', 'data-ticket-url', 'data-href-url'].forEach(function (
          attr
        ) {
          var v = el.getAttribute(attr);
          if (!v) return;
          var abs = absolutizeHref(v);
          if (/^https?:\/\//i.test(abs)) {
            candidates.push({ url: abs, score: TICKET_HOST_RE.test(abs) ? 20 : 6 });
          }
        });
      });

    candidates.sort(function (a, b) {
      return b.score - a.score;
    });
    return candidates[0] ? candidates[0].url : '';
  }

  function collectJsonLdTicketPairs(root) {
    var list = [];
    if (!root) return list;
    root.querySelectorAll('script[type="application/ld+json"]').forEach(function (sc) {
      var text = (sc.textContent || '').trim();
      if (!text) return;
      try {
        var data = JSON.parse(text);
        function walk(o) {
          if (!o || typeof o !== 'object') return;
          if (Array.isArray(o)) {
            o.forEach(walk);
            return;
          }
          if (o['@graph']) {
            walk(o['@graph']);
            return;
          }
          var types = o['@type'];
          var tArr = Array.isArray(types) ? types : types ? [types] : [];
          var isEvent = tArr.some(function (t) {
            return /event/i.test(String(t));
          });
          if (!isEvent || !o.startDate) return;
          var off = o.offers;
          var url = '';
          if (off) {
            var first = Array.isArray(off) ? off[0] : off;
            if (typeof first === 'string') url = first;
            else if (first && typeof first.url === 'string') url = first.url;
          }
          if (url && /^https?:\/\//i.test(absolutizeHref(url))) {
            var day = new Date(o.startDate).setHours(0, 0, 0, 0);
            list.push({ dayTs: day, url: absolutizeHref(url) });
          }
        }
        walk(data);
      } catch (e) {}
    });
    return list;
  }

  function jsonLdUrlForShowDate(show, pairs) {
    var day = parseSeatedDateStartOfDay(show.date);
    if (isNaN(day) || !pairs || !pairs.length) return '';
    for (var i = 0; i < pairs.length; i++) {
      if (pairs[i].dayTs === day) return pairs[i].url;
    }
    return '';
  }

  function resolveTicketUrlForCard(show, root) {
    var row = show._row;
    var url = '';

    if (row && document.body.contains(row)) {
      url = findTicketHrefInRow(row, show.ticketActionEl);
      if (!url) {
        var t = findTicketClickTarget(row, show.ticketActionEl);
        if (t && t.tagName === 'A') {
          try {
            var attr = t.getAttribute('href') || '';
            if (attr && attr !== '#' && !/^javascript:/i.test(attr)) {
              url = String(t.href || '');
            }
          } catch (e) {}
        }
      }
      if (!url || !/^https?:\/\//i.test(url)) {
        url = findBestTicketUrlFromRow(row);
      }
    }

    if ((!url || !/^https?:\/\//i.test(url)) && show.href) {
      var sh = String(show.href).trim();
      if (/^https?:\/\//i.test(sh) || sh.indexOf('/') === 0) {
        url = absolutizeHref(sh);
      }
    }

    if ((!url || !/^https?:\/\//i.test(url)) && root) {
      if (!root._linksJsonLdPairs) {
        root._linksJsonLdPairs = collectJsonLdTicketPairs(root);
      }
      url = jsonLdUrlForShowDate(show, root._linksJsonLdPairs) || url;
    }

    if (url && /^https?:\/\//i.test(url)) return url;
    return '';
  }

  /**
   * The actual element Seated uses for Tickets/RSVP — clicking this matches the widget.
   * Prefer <button> with ticket text; else best <a>.
   */
  function findTicketClickTarget(row, actionEl) {
    if (!row) return null;

    if (actionEl && row.contains(actionEl)) {
      if (actionEl.tagName === 'BUTTON') return actionEl;
      if (actionEl.tagName === 'A') {
        var ah = actionEl.getAttribute('href');
        if (ah && !/^javascript:/i.test(ah) && ah !== '#') return actionEl;
      }
    }

    var btns = Array.from(row.querySelectorAll('button')).filter(function (b) {
      return /tickets|rsvp|buy|register|get tickets|reserve/i.test((b.textContent || '').trim());
    });
    if (btns.length) return btns[0];

    var roleBtns = Array.from(row.querySelectorAll('[role="button"]')).filter(function (b) {
      return /tickets|rsvp|buy|register|get tickets|reserve/i.test((b.textContent || '').trim());
    });
    if (roleBtns.length) return roleBtns[0];

    var bestA = null;
    var bestSc = -1;
    queryAnchorsInRow(row).forEach(function (a) {
      var sc = scoreTicketAnchor(a);
      if (sc > bestSc) {
        bestSc = sc;
        bestA = a;
      }
    });
    if (bestA && bestSc > 0) return bestA;

    queryAnchorsInRow(row).forEach(function (a) {
      var h = a.getAttribute('href');
      if (h && /^https?:\/\//i.test(absolutizeHref(h))) bestA = a;
    });
    return bestA;
  }

  function extractShowFromRow(row, actionEl) {
    if (!row) return null;
    var rawLines = getCleanLines(row);
    if (!rawLines.length) return null;

    var lines = rawLines.filter(function (line) {
      return !isActionLine(line);
    });
    var dateLineIndex = lines.findIndex(isDateLine);
    if (dateLineIndex === -1) return null;

    var date = lines[dateLineIndex];
    var detailLines = lines.slice(dateLineIndex + 1);

    var timeLine = detailLines.find(function (line) {
      return timeRegex.test(line);
    }) || '';
    var cityLine = detailLines.find(function (line) {
      return cityStateRegex.test(line);
    }) || '';
    var venueLine =
      detailLines.find(function (line) {
        return line !== timeLine && line !== cityLine;
      }) || '';

    if (!venueLine && detailLines.length === 1) {
      var combined = splitCombinedLine(detailLines[0]);
      timeLine = timeLine || combined.timeLine;
      cityLine = cityLine || combined.cityLine;
      venueLine = combined.venueLine || venueLine;
    }

    if (!venueLine && date && lines[dateLineIndex].length > date.length + 5) {
      var combined2 = splitCombinedLine(lines[dateLineIndex]);
      timeLine = timeLine || combined2.timeLine;
      cityLine = cityLine || combined2.cityLine;
      venueLine = combined2.venueLine || venueLine;
    }

    var ticketActionEl = findTicketClickTarget(row, actionEl);
    var href = '';
    if (ticketActionEl && ticketActionEl.tagName === 'A' && ticketActionEl.href) {
      try {
        href = String(ticketActionEl.href);
      } catch (e) {
        href = findTicketHrefInRow(row, actionEl);
      }
    } else {
      href = findTicketHrefInRow(row, actionEl);
    }
    if (!href || !/^https?:\/\//i.test(href)) {
      href = findBestTicketUrlFromRow(row) || href;
    }

    return {
      date: date,
      timeLine: timeLine,
      cityLine: cityLine,
      venueLine: venueLine,
      href: href,
      ticketActionEl: ticketActionEl,
      _row: row
    };
  }

  function parseShows(root) {
    var shows = [];
    var seenRows = new Set();

    var actionEls = Array.from(root.querySelectorAll('a, button')).filter(function (el) {
      return /tickets|rsvp|buy|register/i.test((el.textContent || '').trim());
    });

    actionEls.forEach(function (el) {
      var row = findRowWithDate(el, root);
      if (!row || seenRows.has(row)) return;
      seenRows.add(row);
      var show = extractShowFromRow(row, el);
      if (show) shows.push(show);
    });

    if (shows.length === 0) {
      var dateNodes = Array.from(root.querySelectorAll('*')).filter(function (node) {
        if (node.closest('script, style, noscript')) return false;
        return isDateLine((node.textContent || '').trim());
      });

      dateNodes.forEach(function (node) {
        var row = findRowWithDate(node, root);
        if (!row || seenRows.has(row)) return;
        seenRows.add(row);
        var show = extractShowFromRow(row, row.querySelector('a[href]'));
        if (show) shows.push(show);
      });
    }

    return shows;
  }

  function parseSeatedDateStartOfDay(dateStr) {
    if (!dateStr) return NaN;
    var m = dateStr.match(
      /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\s+(\d{1,2}),?\s+(\d{4})/i
    );
    if (m) {
      var mon = m[1].toUpperCase();
      var mi = MONTH_MAP[mon];
      if (mi !== undefined) {
        return new Date(parseInt(m[3], 10), mi, parseInt(m[2], 10)).setHours(0, 0, 0, 0);
      }
    }
    m = dateStr.match(
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i
    );
    if (m) {
      var key = m[1].toLowerCase();
      var mi2 = LONG_MONTHS[key];
      if (mi2 !== undefined) {
        return new Date(parseInt(m[3], 10), mi2, parseInt(m[2], 10)).setHours(0, 0, 0, 0);
      }
    }
    var d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.setHours(0, 0, 0, 0);
    return NaN;
  }

  function startOfToday() {
    var t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  }

  /**
   * Turn raw row parse into { date, timeLine, cityLine, title, href }.
   * Title = event name (after city); subtitle uses date/time/city only — no duplicate blob.
   */
  function structureFromRaw(show) {
    var blob = normalizeRunTogether(
      [show.date, show.venueLine, show.cityLine, show.timeLine].filter(Boolean).join(' ')
    );
    var dm = blob.match(dateRegexShort) || blob.match(dateRegexLong);
    var date = dm ? dm[0] : show.date;

    var rest = dm ? blob.slice(blob.indexOf(dm[0]) + dm[0].length).trim() : blob;
    var timeFromBlob = blob.match(timeRegex);
    var timeLine = (timeFromBlob && timeFromBlob[0]) || show.timeLine || '';

    var cm = rest.match(cityStateRegex);
    var cityLine = cm ? cm[0] : show.cityLine || '';

    var title = '';
    var venueShort = '';

    if (cm) {
      var ci = rest.indexOf(cm[0]);
      venueShort = rest.slice(0, ci).replace(timeRegex, '').trim();
      title = rest.slice(ci + cm[0].length).replace(timeRegex, '').trim();
    } else {
      venueShort = rest.replace(timeRegex, '').trim();
    }

    if (!title || title.length < 4) {
      title = venueShort || show.venueLine || date || 'Show';
      venueShort = '';
    }

    return {
      date: date,
      timeLine: timeLine,
      cityLine: cityLine,
      title: title,
      href: show.href || '',
      ticketActionEl: show.ticketActionEl,
      _row: show._row
    };
  }

  function hrefKey(href) {
    if (!href || href === '#') return '';
    try {
      var u = href.split('?')[0].replace(/\/$/, '');
      return u.toLowerCase();
    } catch (e) {
      return href;
    }
  }

  function dedupeStructured(list) {
    var seen = Object.create(null);
    var out = [];
    list.forEach(function (s) {
      var ts = parseSeatedDateStartOfDay(s.date);
      var hk = hrefKey(s.href);
      var tit = (s.title || '').replace(/\s+/g, ' ').trim().toLowerCase();
      var key =
        hk && hk.length > 0
          ? hk + '|' + ts
          : 'nohref|' + ts + '|' + tit.slice(0, 96);
      if (seen[key]) return;
      seen[key] = true;
      out.push(s);
    });
    return out;
  }

  function normalizeForCompare(str) {
    return String(str || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/\.$/, '');
  }

  /**
   * Seated often renders two DOM rows for one gig (e.g. two buttons / mobile + desktop).
   * The phantom row parses with title = date only — drop those when a real title exists that day.
   */
  function isDateOnlyTitle(title, dateStr) {
    var t = normalizeForCompare(title);
    var d = normalizeForCompare(dateStr);
    if (!t) return true;
    if (t === d) return true;
    if (
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}$/.test(
        t
      )
    ) {
      return true;
    }
    if (
      /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}$/.test(
        t
      )
    ) {
      return true;
    }
    return false;
  }

  function collapseSameDayPhantomRows(shows) {
    var byTs = Object.create(null);
    shows.forEach(function (s) {
      var ts = parseSeatedDateStartOfDay(s.date);
      if (isNaN(ts)) return;
      if (!byTs[ts]) byTs[ts] = [];
      byTs[ts].push(s);
    });

    var out = [];
    Object.keys(byTs).forEach(function (k) {
      var group = byTs[k];
      if (group.length === 1) {
        out.push(group[0]);
        return;
      }

      var strong = group.filter(function (s) {
        return !isDateOnlyTitle(s.title, s.date);
      });

      if (strong.length > 0) {
        var seenTitle = Object.create(null);
        strong.forEach(function (s) {
          var tk = normalizeForCompare(s.title).slice(0, 96);
          if (seenTitle[tk]) return;
          seenTitle[tk] = true;
          out.push(s);
        });
        return;
      }

      out.push(group[0]);
    });

    return out;
  }

  function getNextTwoFromSeated(root) {
    var raw = parseShows(root);
    var structured = raw.map(structureFromRaw);
    var deduped = dedupeStructured(structured);
    deduped = collapseSameDayPhantomRows(deduped);
    var today = startOfToday();

    var upcoming = deduped.filter(function (s) {
      var ts = parseSeatedDateStartOfDay(s.date);
      return !isNaN(ts) && ts >= today;
    });

    upcoming.sort(function (a, b) {
      return parseSeatedDateStartOfDay(a.date) - parseSeatedDateStartOfDay(b.date);
    });

    return upcoming.slice(0, MAX_PREVIEW_SHOWS);
  }

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return String(s || '').replace(/"/g, '&quot;').replace(/</g, '');
  }

  function dateBadgeParts(dateStr) {
    var m = dateStr.match(
      /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\s+(\d{1,2})/i
    );
    if (m) {
      return { day: m[2], month: m[1].toUpperCase() };
    }
    m = dateStr.match(
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i
    );
    if (m) {
      var short = m[1].slice(0, 3).toUpperCase();
      return { day: m[2], month: short };
    }
    return { day: '—', month: '' };
  }

  /** One line only: date · time · city (never repeat the title) */
  function formatSubtitle(show) {
    return [show.date, show.timeLine, show.cityLine].filter(Boolean).join(' · ');
  }

  function renderTwoCards(container, shows, root) {
    if (!container || !shows || !shows.length) return;

    var origin = '';
    try {
      origin = window.location.origin || '';
    } catch (e) {}
    var scrollFallback = (origin || 'https://www.calebzeringue.com') + '/links#seated-tickets';

    var html = shows
      .map(function (show, index) {
        var ticketUrl = resolveTicketUrlForCard(show, root);
        if (!ticketUrl) ticketUrl = scrollFallback;

        var target = '_blank';
        var rel = 'noopener noreferrer';
        try {
          if (
            window.location &&
            ticketUrl.indexOf(window.location.origin + '/links') === 0 &&
            ticketUrl.indexOf('#') !== -1
          ) {
            target = '_self';
          }
        } catch (e) {}

        var badge = dateBadgeParts(show.date);
        var rankLabel = index === 0 ? 'Next show' : 'Also coming up';
        var sub = formatSubtitle(show);
        var cardClass =
          'links-next-show-card' + (index > 0 ? ' links-next-show-card--second' : '');

        return (
          '<a href="' +
          escapeAttr(ticketUrl) +
          '" target="' +
          target +
          '" rel="' +
          rel +
          '" class="' +
          cardClass +
          '">' +
          '<span class="links-next-show-badge">' +
          escapeHtml(rankLabel) +
          '</span>' +
          '<div class="links-next-show-datebox" aria-hidden="true">' +
          '<span class="links-next-show-day">' +
          escapeHtml(badge.day) +
          '</span>' +
          '<span class="links-next-show-month">' +
          escapeHtml(badge.month) +
          '</span>' +
          '</div>' +
          '<div class="links-next-show-body">' +
          '<span class="links-next-show-title">' +
          escapeHtml(show.title) +
          '</span>' +
          '<span class="links-next-show-meta">' +
          escapeHtml(sub) +
          '</span>' +
          '<span class="links-next-show-cta">Tickets / RSVP →</span>' +
          '</div>' +
          '</a>'
        );
      })
      .join('');

    container.innerHTML = html;
  }

  function loadLinksShowsFromSeated() {
    var section = document.getElementById('linksNextShowSection');
    var spotlight = document.getElementById('linksNextShowSpotlight');
    var root = document.getElementById(SEATED_ROOT_ID);
    if (!spotlight || !root || !section) return;

    function renderAll() {
      root._linksJsonLdPairs = null;

      var rawCount = parseShows(root).length;
      if (rawCount === 0) return false;

      var two = getNextTwoFromSeated(root);
      if (two.length === 0) {
        section.hidden = true;
        section.setAttribute('aria-hidden', 'true');
        spotlight.innerHTML = '';
        return true;
      }

      section.hidden = false;
      section.setAttribute('aria-hidden', 'false');
      spotlight.classList.add('links-next-shows-row');
      renderTwoCards(spotlight, two, root);
      return true;
    }

    spotlight.innerHTML =
      '<p class="links-next-show-loading">Loading next dates from Seated…</p>';

    if (renderAll()) {
      startNextUpRefresh(root, section, spotlight, renderAll);
      return;
    }

    var observer = new MutationObserver(function () {
      if (renderAll()) {
        startNextUpRefresh(root, section, spotlight, renderAll);
      }
    });
    observer.observe(root, { childList: true, subtree: true });

    setTimeout(function () {
      observer.disconnect();
      if (!renderAll()) {
        section.hidden = true;
        section.setAttribute('aria-hidden', 'true');
        spotlight.innerHTML = '';
      } else {
        startNextUpRefresh(root, section, spotlight, renderAll);
      }
    }, 15000);
  }

  /** Re-parse Seated + re-pick next 2 as dates pass or widget updates */
  function startNextUpRefresh(root, section, spotlight, renderAll) {
    if (root._linksNextUpRefreshStarted) return;
    root._linksNextUpRefreshStarted = true;

    setInterval(function () {
      if (!document.body.contains(root)) return;
      renderAll();
    }, 120000);

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && document.body.contains(root)) {
        renderAll();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLinksShowsFromSeated);
  } else {
    loadLinksShowsFromSeated();
  }
})();

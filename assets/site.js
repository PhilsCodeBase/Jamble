/* Jamble: Beitragsarten-Tabs und Cookie-Hinweis. Keine externen Abrufe, keine Tracker. */
(function () {
  'use strict';
  var EN = document.documentElement.lang === 'en';

  /* ---------- Beitragsarten ---------- */
  var panel = document.getElementById('panel');
  if (panel) {
    var data = [
      { img: 'img/p-media.webp', alt: 'Neuen visuellen Beitrag erstellen', t: 'Bilder & Videos', p: 'Lade Fotos und Videos aus deiner Galerie hoch oder füge einen YouTube-Link ein. Mit Beschreibung, Vorschau und Entwurf. Die Reichweite legst du selbst fest, standardmäßig sehen es alle.' },
      { img: 'img/p-audio.webp', alt: 'Neuen Musik-Beitrag erstellen', t: 'Audio & Musik', p: 'Teile deine eigenen Aufnahmen als mp3 oder wav bis 25 MB oder verlinke Songs von Spotify, Apple Music und SoundCloud.' },
      { img: 'img/p-text.webp', alt: 'Neuen Text-Beitrag erstellen', t: 'Textbeitrag', p: 'Für Gedanken, Gesuche und Ankündigungen. Kurz und direkt, so groß und so auffällig, wie du es im Feed haben willst.' },
      { img: 'img/p-jam.webp', alt: 'Neue Jam-Session erstellen', t: 'Jam-Session', tint: '#e9a23b', p: 'Lade zu einer Session ein, öffentlich oder privat. Öffentliche Jams sind für alle auf der Karte sichtbar, Eingeladene bekommen zusätzlich eine Benachrichtigung. Du gibst Name, genaue Adresse und optional den Namen des Orts an.' },
      { img: 'img/p-concert.webp', alt: 'Neues Konzert erstellen', t: 'Konzert', tint: '#5b94bb', p: 'Trag dein Konzert mit Name, genauer Adresse und Eintritt (kostenlos oder mit Eintritt) ein, damit andere es finden. Die Beschreibung eignet sich für Support-Acts und Einlass.' }
    ];
    if (EN) data = [
      { img: 'img/p-media.webp', alt: 'Create a new visual post', t: 'Photos & videos', p: 'Upload photos and videos from your gallery or add a YouTube link. With description, preview and draft. You decide the reach yourself; by default everyone can see it.' },
      { img: 'img/p-audio.webp', alt: 'Create a new music post', t: 'Audio & music', p: 'Share your own recordings as mp3 or wav up to 25 MB or link songs from Spotify, Apple Music and SoundCloud.' },
      { img: 'img/p-text.webp', alt: 'Create a new text post', t: 'Text post', p: 'For thoughts, requests and announcements. Short and direct, as big and as eye-catching as you want it in the feed.' },
      { img: 'img/p-jam.webp', alt: 'Create a new jam session', t: 'Jam session', tint: '#e9a23b', p: 'Invite people to a session, public or private. Public jams are visible to everyone on the map, and invited people also get a notification. You enter a name, the exact address and optionally the name of the venue.' },
      { img: 'img/p-concert.webp', alt: 'Create a new gig', t: 'Gig', tint: '#5b94bb', p: 'Add your gig with name, exact address and admission (free or paid) so others can find it. The description is a good place for support acts and doors.' }
    ];
    var img = document.getElementById('maker-img');
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
    var show = function (i) {
      var d = data[i];
      tabs.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      panel.setAttribute('aria-labelledby', 't' + i);
      panel.style.setProperty('--tint', d.tint || 'var(--accent-ink)');
      panel.textContent = '';
      var h = document.createElement('h3'); h.textContent = d.t;
      var p = document.createElement('p'); p.textContent = d.p;
      panel.appendChild(h); panel.appendChild(p);
      img.src = d.img; img.alt = d.alt;
    };
    tabs.forEach(function (b) { b.addEventListener('click', function () { show(Number(b.dataset.i)); }); });
    show(0);
  }

  /* ---------- Cookie-Hinweis mit Widerruf ---------- */
  var KEY = 'jamble-consent-v1';
  var read = function () { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  var write = function (v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* ohne Speicher erscheint der Hinweis erneut */ } };
  var clear = function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignorieren */ } };

  var el = function (tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  };
  var btn = function (label, cls, fn) { var b = el('button', { type: 'button', 'class': 'btn sm ' + cls, text: label }); b.addEventListener('click', fn); return b; };

  var box = el('div', { 'class': 'ck', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'ck-title', hidden: '' });
  document.body.appendChild(box);

  var close = function () { box.hidden = true; };
  var accept = function () { write({ necessary: true, ts: new Date().toISOString() }); close(); };

  var renderBanner = function () {
    box.textContent = '';
    var link = el('a', { href: EN ? 'privacy-en.html' : 'datenschutz.html', text: EN ? 'privacy policy' : 'Datenschutzerklärung' });
    var txt = el('p', {}, [
      document.createTextNode(EN ? 'This website does not use tracking, statistics or marketing cookies. Only what is technically necessary is stored, namely your choice here. More in the ' : 'Diese Website setzt keine Tracking-, Statistik- oder Marketing-Cookies ein. Gespeichert wird nur Technisch Notwendiges, nämlich deine Auswahl hier. Mehr dazu in der '),
      link, document.createTextNode('.')
    ]);
    box.appendChild(el('h2', { id: 'ck-title', text: EN ? 'Cookies and storage' : 'Cookies und Speicherung' }));
    box.appendChild(txt);
    box.appendChild(el('div', { 'class': 'row' }, [
      btn(EN ? 'Necessary only' : 'Nur notwendige', '', accept),
      btn(EN ? 'Settings' : 'Einstellungen', 'ghost', renderSettings)
    ]));
    box.hidden = false;
  };

  var renderSettings = function () {
    var c = read();
    box.textContent = '';
    box.appendChild(el('h2', { id: 'ck-title', text: EN ? 'Cookie settings' : 'Cookie-Einstellungen' }));
    var nec = el('label', { 'class': 'opt' }, [
      el('b', { text: EN ? 'Necessary' : 'Notwendig' }),
      el('span', { text: EN ? 'Stores your choice for this notice. Technically required, always on.' : 'Speichert deine Auswahl zu diesem Hinweis. Technisch erforderlich, immer aktiv.' }),
      el('input', { type: 'checkbox', checked: '', disabled: '' })
    ]);
    var oth = el('label', { 'class': 'opt' }, [
      el('b', { text: EN ? 'Statistics and marketing' : 'Statistik und Marketing' }),
      el('span', { text: EN ? 'Not in use. This website does not use such services.' : 'Nicht im Einsatz. Diese Website nutzt keine solchen Dienste.' }),
      el('input', { type: 'checkbox', disabled: '' })
    ]);
    box.appendChild(nec); box.appendChild(oth);
    if (c && c.ts) {
      var d = new Date(c.ts);
      box.appendChild(el('p', { text: EN ? 'Saved on ' + d.toLocaleDateString('en-GB') + '.' : 'Gespeichert am ' + d.toLocaleDateString('de-DE') + '.' }));
    }
    box.appendChild(el('div', { 'class': 'row' }, [
      btn(EN ? 'Save' : 'Speichern', '', accept),
      btn(EN ? 'Withdraw consent' : 'Einwilligung widerrufen', 'ghost', function () { clear(); renderBanner(); })
    ]));
    box.hidden = false;
  };

  if (!read()) renderBanner();
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
    if (t) { e.preventDefault(); renderSettings(); }
  });
})();

/* ---------- Buchstaben-Wackeln bei Hover (wie im Referenzvideo), ohne Bibliothek ----------
   Der Text wird erst beim Hover in Buchstaben zerlegt und danach wieder zusammengesetzt,
   damit er im Ruhezustand normal gesetzt bleibt (Kerning, Textauswahl, Screenreader). */
(function () {
  'use strict';
  if (!window.Element || !Element.prototype.animate) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  var textNodes = function (root) {
    var out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) {
      if (n.nodeValue.trim() && !(n.parentNode.closest && n.parentNode.closest('svg'))) out.push(n);
    }
    return out;
  };

  var run = function (el, power) {
    if (el.__wob) return;
    el.__wob = true;
    var swaps = [], letters = [];
    textNodes(el).forEach(function (t) {
      var frag = document.createDocumentFragment();
      t.nodeValue.split('').forEach(function (ch) {
        if (/\s/.test(ch)) { frag.appendChild(document.createTextNode(ch)); return; }
        var s = document.createElement('span');
        s.className = 'wl'; s.textContent = ch;
        frag.appendChild(s); letters.push(s);
      });
      var first = frag.firstChild, last = frag.lastChild;
      t.parentNode.replaceChild(frag, t);
      swaps.push({ orig: t, first: first, last: last });
    });
    var anims = letters.map(function (s, i) {
      return s.animate([
        { transform: 'none' },
        { transform: 'translate(' + rnd(-2, 2) * power + 'px,' + rnd(-4, 1) * power + 'px) rotate(' + rnd(-14, 14) * power + 'deg)', offset: 0.35 },
        { transform: 'none' }
      ], { duration: 420 + rnd(0, 160), delay: i * 16, easing: 'cubic-bezier(.3,1.5,.5,1)' }).finished;
    });
    Promise.all(anims).catch(function () {}).then(function () {
      swaps.forEach(function (sw) {
        var parent = sw.first.parentNode, node = sw.first, nodes = [];
        while (node) { nodes.push(node); if (node === sw.last) break; node = node.nextSibling; }
        parent.insertBefore(sw.orig, sw.first);
        nodes.forEach(function (x) { parent.removeChild(x); });
      });
      el.__wob = false;
    });
  };

  Array.prototype.forEach.call(document.querySelectorAll('.btn, nav.main a, .tab, .chip, footer.site a'), function (el) {
    var power = el.classList.contains('chip') ? 0.8 : 1;
    if (el.closest && el.closest('.ck')) return;       // Cookie-Hinweis: Text bleibt ruhig
    el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') run(el, power); });   // nicht bei Touch
    el.addEventListener('focus', function () { if (el.matches && el.matches(':focus-visible')) run(el, power); });
  });
})();

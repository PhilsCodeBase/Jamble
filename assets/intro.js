/* Startanimation: Das Jamble-Logo steht groß und gestochen scharf (vektorgezeichnet, ohne Bewegung).
   Nach 1 s, oder früher beim Tippen, Klicken, Scrollen oder einer Taste, zerfällt es von links nach rechts zu feinem Staub.
   Eigene Canvas-Umsetzung, keine Bibliothek, keine Speicherung, keine externen Anfragen. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sameSite = false;
  try { sameSite = !!document.referrer && new URL(document.referrer).host === location.host; } catch (e) { /* ignorieren */ }
  if (reduce || sameSite || location.hash.length > 1) return;   // kein Intro bei Bewegungsreduktion, internen Links und Ankern

  root.classList.add('intro-pending');
  var done = function () { root.classList.remove('intro-pending'); };

  /* Logo-Geometrie, vom App-Icon abgemessen (Einheiten: 192 x 192) */
  var BARS = [[33, 38], [54, 80], [75, 56], [96, 108], [117, 58], [138, 68], [159, 40]]; // [Mitte x, Höhe]
  var BAR_W = 11, BAR_COLOR = '#7c4b67', TEXT_COLOR = '#f5eff4', DARK_TEXT = '#1a1320';

  var boot = function () {
    var overlay = document.createElement('div');
    overlay.className = 'intro';
    overlay.setAttribute('role', 'button');
    overlay.setAttribute('tabindex', '0');
    overlay.setAttribute('aria-label', root.lang === 'en' ? 'Skip intro and open Jamble' : 'Intro überspringen und Jamble öffnen');
    var logoCv = document.createElement('canvas'); logoCv.className = 'logo'; logoCv.setAttribute('aria-hidden', 'true');
    var dustCv = document.createElement('canvas'); dustCv.className = 'dust'; dustCv.setAttribute('aria-hidden', 'true');
    overlay.appendChild(logoCv); overlay.appendChild(dustCv);
    document.body.appendChild(overlay);

    var others = Array.prototype.slice.call(document.body.children).filter(function (n) { return n !== overlay; });
    others.forEach(function (n) { n.inert = true; });
    overlay.focus({ preventScroll: true });

    var lctx = logoCv.getContext('2d', { willReadFrequently: true });
    var dctx = dustCv.getContext('2d');
    var dpr = 1, cw = 0, ch = 0, tTrigger = 0, raf = 0, finished = false, auto = 0, resizeT = 0, P = null, buf = null;

    var rr = function (c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    };

    /* Schriftfarbe passend zum Hintergrund: dunkel auf hellem, hell auf dunklem Grund */
    var textColor = function () {
      var m = (getComputedStyle(overlay).backgroundColor || '').match(/\d+(\.\d+)?/g) || [];
      var lum = m.length > 2 ? (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) : 0;
      return lum > 140 ? DARK_TEXT : TEXT_COLOR;
    };

    /* Logo scharf in Gerätepixeln zeichnen */
    var drawLogo = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      var vw = window.innerWidth, vh = window.innerHeight;
      cw = Math.round(vw * dpr); ch = Math.round(vh * dpr);
      [logoCv, dustCv].forEach(function (c) { c.width = cw; c.height = ch; c.style.width = vw + 'px'; c.style.height = vh + 'px'; });
      lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, cw, ch);
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var size = Math.min(vw * 0.46, vh * 0.34, 300), k = size / 192;
      var fs = size * 0.2, gap = size * 0.2, blockH = size + gap + fs;
      var x0 = (vw - size) / 2, y0 = Math.max(16, (vh - blockH) / 2 - vh * 0.03);
      lctx.fillStyle = '#ffffff'; rr(lctx, x0, y0, size, size, 52 * k); lctx.fill();
      lctx.fillStyle = BAR_COLOR;
      BARS.forEach(function (b) {
        var w = BAR_W * k, h = b[1] * k, x = x0 + b[0] * k - w / 2, y = y0 + 96 * k - h / 2;
        rr(lctx, x, y, w, h, w / 2); lctx.fill();
      });
      lctx.font = '700 ' + fs + 'px Poppins, system-ui, sans-serif';
      lctx.textBaseline = 'top'; lctx.fillStyle = textColor();
      var word = 'JAMBLE', sp = fs * 0.32, tw = 0, i, x;
      for (i = 0; i < word.length; i++) tw += lctx.measureText(word[i]).width + (i < word.length - 1 ? sp : 0);
      x = (vw - tw) / 2;
      for (i = 0; i < word.length; i++) { lctx.fillText(word[i], x, y0 + size + gap); x += lctx.measureText(word[i]).width + sp; }
      lctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    /* Staubteilchen erst beim Auslösen aus dem fertigen Logo abtasten */
    var sample = function () {
      var data = lctx.getImageData(0, 0, cw, ch).data;
      var stepCss = 0.5, cell, n;
      var scan = function (c) { var m = 0, y, x; for (y = 0; y < ch; y += c) for (x = 0; x < cw; x += c) if (data[((y + (c >> 1)) * cw + x + (c >> 1)) * 4 + 3] > 24) m++; return m; };
      cell = Math.max(1, Math.round(stepCss * dpr)); n = scan(cell);
      while (n > 110000) { cell++; n = scan(cell); }
      P = { n: n, cell: cell, x: new Float32Array(n), y: new Float32Array(n), hx: new Float32Array(n), hy: new Float32Array(n), cx: new Float32Array(n), cy: new Float32Array(n),
        vx: new Float32Array(n), vy: new Float32Array(n), dl: new Float32Array(n), ph: new Float32Array(n), life: new Float32Array(n),
        sz: new Uint8Array(n), al: new Uint8Array(n), r: new Uint8Array(n), g: new Uint8Array(n), b: new Uint8Array(n), st: new Uint8Array(n) };
      var i = 0, y, x, p, j, m, GR = 205, GG = 195, GB = 202;
      for (y = 0; y < ch; y += cell) for (x = 0; x < cw; x += cell) {
        p = ((y + (cell >> 1)) * cw + x + (cell >> 1)) * 4;
        if (data[p + 3] > 24 && i < n) {
          P.al[i] = data[p + 3];
          j = 0.85 + Math.random() * 0.3;
          // Staub: Farbe des Logos stark Richtung mattes Grau gemischt, damit nichts bunt wirkt
          P.r[i] = Math.min(255, (data[p] * 0.3 + GR * 0.7) * j); P.g[i] = Math.min(255, (data[p + 1] * 0.3 + GG * 0.7) * j); P.b[i] = Math.min(255, (data[p + 2] * 0.3 + GB * 0.7) * j);
          P.cx[i] = x; P.cy[i] = y; P.hx[i] = x + Math.random() * cell; P.hy[i] = y + Math.random() * cell;
          P.x[i] = P.hx[i]; P.y[i] = P.hy[i];
          P.dl[i] = 150 + (x / cw) * 700 + (y / ch) * 120 + 70 * Math.sin(y / ch * 11 + x / cw * 5) + Math.random() * 170;           // Zerfall von links nach rechts
          P.ph[i] = Math.random() * 6.283;
          P.life[i] = 0.9 + Math.random() * 1.3;
          m = Math.random(); P.sz[i] = m < 0.08 ? 2 : 1;
          P.vx[i] = (0.3 + Math.random() * 1.2) * dpr; P.vy[i] = (-0.1 - Math.random() * 0.7) * dpr;
          i++;
        }
      }
      P.n = i; P.maxDl = 0; for (j = 0; j < i; j++) if (P.dl[j] > P.maxDl) P.maxDl = P.dl[j]; P.wiped = false;
    };

    var last = 0;
    var frame = function (now) {
      var f = Math.min(now - last, 50) / 16.7; last = now;
      var dis = now - tTrigger, alive = 0, wiped = false, i, a, age, bx, by, dy, dx, row, idx, sz, d = buf.data;
      d.fill(0);
      if (!P.wiped && dis > P.maxDl + 150) { lctx.clearRect(0, 0, cw, ch); P.wiped = true; }
      for (i = 0; i < P.n; i++) {
        if (!P.st[i]) {
          if (dis < P.dl[i]) { alive++; continue; }
          P.st[i] = 1;
          lctx.clearRect(P.cx[i], P.cy[i], P.cell, P.cell);   // Logo an dieser Stelle weg
        }
        age = (dis - P.dl[i]) / 1000;
        if (age > P.life[i]) continue;
        alive++;
        P.vx[i] = (P.vx[i] + (0.015 + (Math.random() - 0.5) * 0.10) * dpr * f) * Math.pow(0.986, f);
        P.vy[i] = (P.vy[i] + (-0.010 + (Math.random() - 0.5) * 0.09) * dpr * f) * Math.pow(0.986, f);
        P.x[i] += P.vx[i] * f + Math.sin(age * 4 + P.ph[i]) * 0.22 * dpr * f;
        P.y[i] += P.vy[i] * f + Math.cos(age * 3 + P.ph[i]) * 0.18 * dpr * f;
        a = 235 * (P.al[i] / 255) * Math.pow(1 - age / P.life[i], 1.2);
        bx = P.x[i] | 0; by = P.y[i] | 0; sz = P.sz[i];
        if (bx < 0 || by < 0 || bx > cw - sz || by > ch - sz) continue;
        for (dy = 0; dy < sz; dy++) {
          row = ((by + dy) * cw + bx) * 4;
          for (dx = 0; dx < sz; dx++) { idx = row + dx * 4; d[idx] = P.r[i]; d[idx + 1] = P.g[i]; d[idx + 2] = P.b[i]; d[idx + 3] = a; }
        }
      }
      dctx.putImageData(buf, 0, 0);
      if (alive === 0) { finish(); return; }
      raf = requestAnimationFrame(frame);
    };

    var finish = function () {
      if (finished) return;
      finished = true; cancelAnimationFrame(raf);
      others.forEach(function (n) { n.inert = false; });
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      done();
      window.removeEventListener('resize', onResize);
    };

    var trigger = function () {
      if (tTrigger || finished) return;
      clearTimeout(auto); clearTimeout(resizeT);
      others.forEach(function (n) { n.inert = false; });
      done();                                    // Seite darunter sichtbar machen
      try { sample(); buf = dctx.createImageData(cw, ch); } catch (e) { finish(); return; }
      tTrigger = performance.now(); last = tTrigger;
      overlay.classList.add('out');
      overlay.style.pointerEvents = 'none';
      raf = requestAnimationFrame(frame);
    };

    overlay.addEventListener('pointerdown', trigger);
    overlay.addEventListener('keydown', function (e) { if (e.key === 'Tab') e.preventDefault(); trigger(); });
    window.addEventListener('wheel', trigger, { passive: true, once: true });
    window.addEventListener('touchmove', trigger, { passive: true, once: true });

    var onResize = function () {
      if (tTrigger || finished) return;
      clearTimeout(resizeT);
      resizeT = setTimeout(drawLogo, 150);
    };
    window.addEventListener('resize', onResize);

    var start = function () {
      drawLogo();
      overlay.classList.add('ready');
      auto = setTimeout(trigger, 1000);         // zerfällt nach 1 s von selbst, Tippen geht schneller
    };
    var fontsReady = document.fonts && document.fonts.load ? document.fonts.load('700 40px Poppins').catch(function () {}) : Promise.resolve();
    var startOnce = function () { if (!startOnce.done) { startOnce.done = true; start(); } };
    fontsReady.then(startOnce);
    setTimeout(startOnce, 1200);                 // bei sehr langsamem Netz nicht länger auf die Schrift warten
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

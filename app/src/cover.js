// Sunset Cover Studio — draws GTA-style poster covers on a 2D canvas.
// Everything here is original art drawn in code: gradient skies, a synthwave sun,
// palm and skyline silhouettes, comic-panel frames and bold outlined lettering.
// No Rockstar logo, artwork or font is used anywhere.

/** Colour themes. grade* tint the photo; accent underlines the caption. */
export const THEMES = {
  sunset: {
    label: 'Sunset Blaze', gradeTop: '#ffb13d', gradeMid: '#ff2e63', gradeBottom: '#2b1055',
    accent: '#ffcf3f', ink: '#160a26', band: '#1c0b33', sunTop: '#ffe259', sunBottom: '#ff5e62',
    skyTop: '#3b1d6e', skyBottom: '#ff7e5f', placeholder: '#4a2170',
  },
  neon: {
    label: 'Neon Nights', gradeTop: '#00e5ff', gradeMid: '#ff2fb3', gradeBottom: '#12002e',
    accent: '#00f0ff', ink: '#0a0616', band: '#150a2e', sunTop: '#7df9ff', sunBottom: '#ff2fb3',
    skyTop: '#0b1e5b', skyBottom: '#c724b1', placeholder: '#122a6e',
  },
  pastel: {
    label: 'Pastel Vice', gradeTop: '#7ef0d4', gradeMid: '#ff8fb3', gradeBottom: '#3d2b63',
    accent: '#ffd166', ink: '#241536', band: '#2c1f4d', sunTop: '#fff3b0', sunBottom: '#ff8fb3',
    skyTop: '#2e6f8e', skyBottom: '#ffb3c6', placeholder: '#3d5a80',
  },
  noir: {
    label: 'Golden Noir', gradeTop: '#f5c542', gradeMid: '#c2274b', gradeBottom: '#0d0d1a',
    accent: '#f5c542', ink: '#0b0b12', band: '#14101f', sunTop: '#ffe98a', sunBottom: '#e07b39',
    skyTop: '#1c1a2e', skyBottom: '#8a3b4d', placeholder: '#2a2438',
  },
};

/** Layout ids in the order the editor offers them. */
export const LAYOUTS = ['hero', 'grid', 'strip', 'quad'];

/** How many photo panels each layout shows. */
export const LAYOUT_PANELS = { hero: 4, grid: 3, strip: 3, quad: 4 };

/** Deterministic hash in [0, 1) from an integer — stable across runs, no Math.random. */
export function hash01(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function gapFor(w, h) {
  return Math.max(4, Math.round(Math.min(w, h) * 0.014));
}

/**
 * Panel rectangles for a layout, in canvas pixels. The first rect is the hero /
 * main panel; the rest are the supporting panels. Also returns the caption zone.
 */
export function panelRects(layout, w, h) {
  const g = gapFor(w, h);
  if (layout === 'grid') {
    const band = Math.round(h * 0.17);
    const leftW = Math.round(w * 0.6);
    const rightX = leftW + g;
    const rightW = w - rightX - g;
    const colH = Math.round((h - band - 3 * g) / 2);
    return [
      { x: g, y: g, w: leftW - 2 * g, h: h - band - 2 * g },
      { x: rightX, y: g, w: rightW, h: colH },
      { x: rightX, y: g + colH + g, w: rightW, h: colH },
    ];
  }
  if (layout === 'strip') {
    const band = Math.round(h * 0.21);
    const pw = Math.round((w - 4 * g) / 3);
    return [0, 1, 2].map((i) => ({ x: g + i * (pw + g), y: band + g, w: pw, h: h - band - 2 * g }));
  }
  if (layout === 'quad') {
    const pw = Math.round((w - 3 * g) / 2);
    const ph = Math.round((h - 3 * g) / 2);
    return [
      { x: g, y: g, w: pw, h: ph },
      { x: g + pw + g, y: g, w: pw, h: ph },
      { x: g, y: g + ph + g, w: pw, h: ph },
      { x: g + pw + g, y: g + ph + g, w: pw, h: ph },
    ];
  }
  // hero: one full-bleed photo, three small panels in a strip along the foot.
  const stripH = Math.round(h * 0.23);
  const stripY = h - stripH - g;
  const pw = Math.round((w - 4 * g) / 3);
  return [
    { x: 0, y: 0, w, h },
    { x: g, y: stripY, w: pw, h: stripH },
    { x: g * 2 + pw, y: stripY, w: pw, h: stripH },
    { x: g * 3 + pw * 2, y: stripY, w: pw, h: stripH },
  ];
}

/** Which panel (if any) contains canvas point (x, y); -1 when none. Panels later in the list win. */
export function hitTestPanel(layout, w, h, x, y) {
  const rects = panelRects(layout, w, h);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

/** A synthwave sun: gradient disc with horizontal slats cut out of its lower half. */
export function drawSun(ctx, cx, cy, r, theme) {
  const off = document.createElement('canvas');
  off.width = Math.ceil(r * 2) + 4;
  off.height = Math.ceil(r * 2) + 4;
  const o = off.getContext('2d');
  const grad = o.createLinearGradient(0, 0, 0, off.height);
  grad.addColorStop(0, theme.sunTop);
  grad.addColorStop(1, theme.sunBottom);
  o.fillStyle = grad;
  o.beginPath();
  o.arc(off.width / 2, off.height / 2, r, 0, Math.PI * 2);
  o.fill();
  o.globalCompositeOperation = 'destination-out';
  let y = off.height / 2 + r * 0.08;
  let thick = Math.max(2, r * 0.03);
  while (y < off.height) {
    o.fillRect(0, y, off.width, thick);
    y += thick + Math.max(4, r * 0.09);
    thick *= 1.5;
  }
  ctx.drawImage(off, cx - off.width / 2, cy - off.height / 2);
}

/** One palm silhouette: a leaning trunk and seven drooping fronds. */
export function drawPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  const topX = x + lean * s;
  const topY = y - s;
  ctx.lineWidth = Math.max(2, s * 0.055);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * s * 0.4, y - s * 0.55, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, s * 0.045);
  for (let i = 0; i < 7; i++) {
    const a = (-160 + i * 26) * (Math.PI / 180);
    const len = s * (0.52 + hash01(i * 7 + Math.round(s)) * 0.22);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + len * 0.22;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.55, topY + Math.sin(a) * len * 0.4 - len * 0.18, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX - s * 0.03, topY + s * 0.02, s * 0.035, 0, Math.PI * 2);
  ctx.arc(topX + s * 0.04, topY + s * 0.03, s * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A low skyline silhouette with a few lit windows, deterministic per index. */
export function drawSkyline(ctx, x, y, w, h, color, accent) {
  ctx.save();
  ctx.fillStyle = color;
  let bx = x;
  let i = 0;
  while (bx < x + w - 4) {
    const bw = w * (0.05 + hash01(i * 3 + 1) * 0.09);
    const bh = h * (0.3 + hash01(i * 5 + 2) * 0.7);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.75;
    const wins = 1 + Math.floor(hash01(i * 11 + 4) * 3);
    for (let k = 0; k < wins; k++) {
      const wx = bx + bw * (0.2 + hash01(i * 17 + k) * 0.6);
      const wy = y + h - bh + bh * (0.15 + hash01(i * 23 + k * 3) * 0.6);
      ctx.fillRect(wx, wy, Math.max(2, bw * 0.08), Math.max(2, bh * 0.05));
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    bx += bw + w * 0.012;
    i++;
  }
  ctx.restore();
}

/** Cover-fits a photo into a rect, honouring zoom and pan offsets (-1..1). */
export function drawPanelPhoto(ctx, rect, panel, theme) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (panel && panel.img && panel.img.naturalWidth > 0) {
    const img = panel.img;
    const zoom = panel.zoom ?? 1;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const pw = img.naturalWidth * scale;
    const ph = img.naturalHeight * scale;
    const ox = (panel.ox ?? 0) * w * 0.35;
    const oy = (panel.oy ?? 0) * h * 0.35;
    ctx.drawImage(img, x + (w - pw) / 2 + ox, y + (h - ph) / 2 + oy, pw, ph);
  } else {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, theme.skyTop);
    grad.addColorStop(1, theme.placeholder);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    drawSun(ctx, x + w * 0.72, y + h * 0.34, Math.min(w, h) * 0.2, theme);
    drawPalm(ctx, x + w * 0.16, y + h, Math.min(w, h) * 0.42, 0.12, 'rgba(10, 4, 20, 0.85)');
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `700 ${Math.max(11, Math.round(h * 0.055))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('YOUR PHOTO HERE', x + w / 2, y + h * 0.56);
  }
  ctx.restore();
  // Comic-panel frame: dark shadow, then a white border.
  const bw = Math.max(3, Math.round(Math.min(w, h) * 0.018));
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(x + bw * 0.7, y + bw * 0.7, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - bw / 2, y - bw / 2, w + bw, bw);
  ctx.fillRect(x - bw / 2, y + h - bw / 2, w + bw, bw);
  ctx.fillRect(x - bw / 2, y, bw, h);
  ctx.fillRect(x + w - bw / 2, y, bw, h);
}

/** Warm sunset wash + vignette over the whole cover. Strength 0..1. */
export function drawGrade(ctx, w, h, theme, strength) {
  if (strength <= 0) return;
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, theme.gradeTop);
  grad.addColorStop(0.55, theme.gradeMid);
  grad.addColorStop(1, theme.gradeBottom);
  ctx.globalAlpha = 0.12 + strength * 0.4;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = strength * 0.22;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(10,4,20,${0.28 * strength + 0.08})`);
  ctx.globalAlpha = 1;
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Bold outlined caption with an accent underline. Returns the drawn text height. */
export function drawCaption(ctx, text, cx, top, maxW, size, theme, glow) {
  const words = (text || '').trim().toUpperCase();
  if (!words) return 0;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let s = size;
  ctx.font = `900 ${s}px "Arial Black", "Helvetica Neue", system-ui, sans-serif`;
  while (ctx.measureText(words).width > maxW && s > 10) {
    s -= 2;
    ctx.font = `900 ${s}px "Arial Black", "Helvetica Neue", system-ui, sans-serif`;
  }
  const lw = Math.max(2, s * 0.14);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = lw;
  ctx.miterLimit = 2;
  if (glow) {
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = s * 0.35;
  }
  ctx.strokeText(words, cx, top);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(words, cx, top);
  ctx.shadowBlur = 0;
  const tw = ctx.measureText(words).width;
  ctx.fillStyle = theme.accent;
  ctx.fillRect(cx - tw / 2, top + s * 0.98, tw, Math.max(3, s * 0.07));
  ctx.restore();
  return s;
}

/** Small pill tag, e.g. the city name. `fs` is the font size in canvas pixels. */
export function drawTag(ctx, text, cx, top, theme, fs = 14) {
  const label = (text || '').trim().toUpperCase();
  if (!label) return 0;
  ctx.save();
  ctx.font = `800 ${fs}px system-ui, sans-serif`;
  const pad = fs * 0.9;
  const tw = ctx.measureText(label).width + pad * 2;
  const th = fs * 2.1;
  ctx.fillStyle = 'rgba(10,4,20,0.72)';
  ctx.beginPath();
  ctx.roundRect(cx - tw / 2, top, tw, th, th / 2);
  ctx.fill();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = Math.max(1.5, fs * 0.1);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, top + th / 2 + 1);
  ctx.restore();
  return th;
}

/**
 * Renders a whole cover. `state` carries layout, theme id, caption, subtitle, city,
 * grade 0..1, glow, palms, and panels: [{img, zoom, ox, oy}]. Draws at canvas size.
 */
export function renderCover(ctx, w, h, state) {
  const theme = THEMES[state.theme] ?? THEMES.sunset;
  const rects = panelRects(state.layout, w, h);
  const count = LAYOUT_PANELS[state.layout] ?? 4;
  const g = gapFor(w, h);

  ctx.fillStyle = theme.band;
  ctx.fillRect(0, 0, w, h);

  // Photos first.
  for (let i = 0; i < count; i++) {
    drawPanelPhoto(ctx, rects[i], state.panels[i], theme);
  }

  // Sunset wash over the photos (not over the lettering that follows).
  drawGrade(ctx, w, h, theme, state.grade ?? 0.7);

  const showArt = state.palms !== false;
  const ink = 'rgba(16,6,30,0.92)';

  if (state.layout === 'hero') {
    // Sun high right, palms low corners, skyline sitting on the panel strip.
    const stripTop = rects[1].y;
    if (showArt) {
      drawSun(ctx, w * 0.79, h * 0.23, Math.min(w, h) * 0.09, theme);
      drawSkyline(ctx, w * 0.04, stripTop - h * 0.1, w * 0.5, h * 0.1, ink, theme.accent);
      drawPalm(ctx, w * 0.03, stripTop, h * 0.18, 0.14, ink);
      drawPalm(ctx, w * 0.93, stripTop, h * 0.15, -0.14, ink);
    }
    ctx.save();
    ctx.translate(w * 0.06, h * 0.06);
    ctx.rotate(-0.035);
    const capH = drawCaption(ctx, state.caption, w * 0.3, 0, w * 0.6, h * 0.115, theme, state.glow);
    ctx.restore();
    if ((state.subtitle || '').trim()) {
      ctx.save();
      ctx.font = `700 ${Math.max(12, Math.round(h * 0.028))}px system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;
      ctx.fillText(state.subtitle.trim(), w * 0.06, h * 0.06 + capH * 1.55);
      ctx.restore();
    }
    drawTag(ctx, state.city, w * 0.9, h * 0.055, theme, Math.max(12, Math.round(h * 0.024)));
  } else if (state.layout === 'grid') {
    const band = Math.round(h * 0.17);
    ctx.fillStyle = theme.band;
    ctx.fillRect(0, h - band, w, band);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, h - band, w, Math.max(3, h * 0.006));
    drawCaption(ctx, state.caption, w * 0.38, h - band + band * 0.1, w * 0.66, band * 0.46, theme, state.glow);
    if ((state.subtitle || '').trim()) {
      ctx.save();
      ctx.font = `600 ${Math.max(11, Math.round(band * 0.15))}px system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(state.subtitle.trim(), w - w * 0.04, h - band * 0.22);
      ctx.restore();
    }
    drawTag(ctx, state.city, w * 0.1, h * 0.02, theme, Math.max(12, Math.round(h * 0.024)));
  } else if (state.layout === 'strip') {
    const band = Math.round(h * 0.21);
    ctx.fillStyle = theme.band;
    ctx.fillRect(0, 0, w, band);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, band - Math.max(3, h * 0.006), w, Math.max(3, h * 0.006));
    if (showArt) drawSun(ctx, w * 0.9, band * 0.5, band * 0.32, theme);
    drawCaption(ctx, state.caption, w * 0.51, band * 0.08, w * 0.58, band * 0.48, theme, state.glow);
    if ((state.subtitle || '').trim()) {
      ctx.save();
      ctx.font = `600 ${Math.max(11, Math.round(band * 0.16))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(state.subtitle.trim(), w * 0.51, band * 0.76);
      ctx.restore();
    }
    drawTag(ctx, state.city, w * 0.11, band * 0.12, theme, Math.max(12, Math.round(band * 0.14)));
  } else {
    // quad: caption rides on a scrim across the foot.
    const scrimH = Math.round(h * 0.22);
    const grad = ctx.createLinearGradient(0, h - scrimH * 1.6, 0, h);
    grad.addColorStop(0, 'rgba(10,4,20,0)');
    grad.addColorStop(1, 'rgba(10,4,20,0.82)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - scrimH * 1.6, w, scrimH * 1.6);
    if (showArt) {
      drawPalm(ctx, w * 0.03, h * 0.99, h * 0.17, 0.14, ink);
      drawPalm(ctx, w * 0.97, h * 0.99, h * 0.14, -0.14, ink);
    }
    drawCaption(ctx, state.caption, w / 2, h - scrimH * 0.86, w * 0.86, scrimH * 0.5, theme, state.glow);
    if ((state.subtitle || '').trim()) {
      ctx.save();
      ctx.font = `600 ${Math.max(11, Math.round(h * 0.022))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(state.subtitle.trim(), w / 2, h - scrimH * 0.14);
      ctx.restore();
    }
    drawTag(ctx, state.city, w * 0.88, h * 0.03, theme, Math.max(12, Math.round(h * 0.024)));
  }
}

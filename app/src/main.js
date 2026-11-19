// Sunset Cover Studio — wires the editor: photos, layout, theme, words, grade,
// export sizes, per-panel crop, and the deterministic ?shot= scenes for screenshots.
import { THEMES, LAYOUTS, LAYOUT_PANELS, panelRects, hitTestPanel, renderCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const cityInput = document.getElementById('city');
const gradeInput = document.getElementById('grade');
const gradeVal = document.getElementById('gradeVal');
const glowInput = document.getElementById('glow');
const palmsInput = document.getElementById('palms');
const statusEl = document.getElementById('status');
const panelBar = document.getElementById('panelBar');

/** The whole cover state; renderCover draws it at any size. */
const state = {
  layout: 'hero',
  theme: 'sunset',
  caption: 'Sunset Heist',
  subtitle: 'One last job under a burning sky',
  city: 'NEON BAY',
  grade: 0.7,
  glow: true,
  palms: true,
  size: '1920x1080',
  panels: [],
};
let selectedPanel = 0;

function blankPanels() {
  const n = 4;
  state.panels = Array.from({ length: n }, () => ({ img: null, zoom: 1, ox: 0, oy: 0 }));
}

function sizeDims() {
  const [w, h] = state.size.split('x').map(Number);
  return { w, h };
}

/** Redraws the preview canvas at the current export size. */
export function redraw() {
  const { w, h } = sizeDims();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  renderCover(ctx, w, h, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Builds the per-panel crop cards under the preview. */
export function buildPanelBar() {
  panelBar.innerHTML = '';
  const count = LAYOUT_PANELS[state.layout];
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'panel-card' + (i === selectedPanel ? ' sel' : '');
    const title = document.createElement('h3');
    title.textContent = i === 0 ? 'Main panel' : `Panel ${i + 1}`;
    const pick = document.createElement('button');
    pick.type = 'button';
    pick.textContent = 'Photo…';
    pick.addEventListener('click', () => {
      selectedPanel = i;
      document.getElementById('photoFile').click();
    });
    title.appendChild(pick);
    card.appendChild(title);
    for (const [key, label, min, max, step] of [
      ['zoom', 'Zoom', 1, 2.5, 0.05],
      ['ox', 'Pan left–right', -1, 1, 0.05],
      ['oy', 'Pan up–down', -1, 1, 0.05],
    ]) {
      const lab = document.createElement('label');
      lab.textContent = label;
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = String(min);
      slider.max = String(max);
      slider.step = String(step);
      slider.value = String(state.panels[i][key]);
      slider.addEventListener('input', () => {
        selectedPanel = i;
        state.panels[i][key] = Number(slider.value);
        buildPanelBar();
        redraw();
      });
      lab.appendChild(slider);
      card.appendChild(lab);
    }
    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
        selectedPanel = i;
        buildPanelBar();
      }
    });
    panelBar.appendChild(card);
  }
}

/** Selects a layout and rebuilds the panel controls. */
export function setLayout(layout) {
  if (!LAYOUTS.includes(layout)) return;
  state.layout = layout;
  selectedPanel = 0;
  document.querySelectorAll('#layoutSeg button').forEach((b) => b.classList.toggle('on', b.dataset.layout === layout));
  buildPanelBar();
  redraw();
}

/** Selects a theme and repaints its swatch. */
export function setTheme(theme) {
  if (!THEMES[theme]) return;
  state.theme = theme;
  document.querySelectorAll('#themeSwatches .swatch').forEach((b) => b.classList.toggle('on', b.dataset.theme === theme));
  redraw();
}

/** Selects an export size. */
export function setSize(size) {
  state.size = size;
  document.querySelectorAll('#sizeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.size === size));
  redraw();
}

/** Puts the same photo object into every panel of the current layout. */
export function fillAllPanels(img) {
  for (const p of state.panels) {
    p.img = img;
    p.zoom = 1;
    p.ox = 0;
    p.oy = 0;
  }
  buildPanelBar();
  redraw();
}

function buildThemeSwatches() {
  const wrap = document.getElementById('themeSwatches');
  for (const [id, theme] of Object.entries(THEMES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (id === state.theme ? ' on' : '');
    b.dataset.theme = id;
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = `linear-gradient(135deg, ${theme.gradeTop}, ${theme.gradeMid} 55%, ${theme.gradeBottom})`;
    b.appendChild(dot);
    b.appendChild(document.createTextNode(theme.label));
    b.addEventListener('click', () => setTheme(id));
    wrap.appendChild(b);
  }
}

document.getElementById('layoutSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-layout]');
  if (b) setLayout(b.dataset.layout);
});
document.getElementById('sizeSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-size]');
  if (b) setSize(b.dataset.size);
});
document.querySelectorAll('[data-sample]').forEach((b) => {
  b.addEventListener('click', async () => {
    try {
      const img = await loadImage(`samples/${b.dataset.sample}.jpg`);
      fillAllPanels(img);
      statusEl.textContent = `Sample photo loaded in every panel — replace it with your own photo any time.`;
    } catch {
      statusEl.textContent = 'That sample photo did not load.';
    }
  });
});
document.getElementById('photoFile').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  for (let k = 0; k < files.length; k++) {
    const img = await loadImage(URL.createObjectURL(files[k]));
    const idx = Math.min(selectedPanel + k, state.panels.length - 1);
    state.panels[idx].img = img;
    state.panels[idx].zoom = 1;
    state.panels[idx].ox = 0;
    state.panels[idx].oy = 0;
  }
  buildPanelBar();
  redraw();
  statusEl.textContent = `${files.length} photo${files.length > 1 ? 's' : ''} loaded. Click a panel to crop it.`;
  e.target.value = '';
});
document.getElementById('fillAll').addEventListener('click', () => {
  const first = state.panels.find((p) => p.img);
  if (!first) {
    statusEl.textContent = 'Load a photo first — then Fill all panels copies it everywhere.';
    return;
  }
  fillAllPanels(first.img);
  statusEl.textContent = 'One photo now fills every panel.';
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
cityInput.addEventListener('input', () => { state.city = cityInput.value; redraw(); });
gradeInput.addEventListener('input', () => {
  state.grade = Number(gradeInput.value) / 100;
  gradeVal.textContent = `${gradeInput.value}%`;
  redraw();
});
glowInput.addEventListener('change', () => { state.glow = glowInput.checked; redraw(); });
palmsInput.addEventListener('change', () => { state.palms = palmsInput.checked; redraw(); });

canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * canvas.width;
  const y = ((e.clientY - r.top) / r.height) * canvas.height;
  const hit = hitTestPanel(state.layout, canvas.width, canvas.height, x, y);
  if (hit >= 0) {
    selectedPanel = hit;
    buildPanelBar();
  }
});

/** Renders the cover at full export size and downloads it as a PNG. */
export function exportCover() {
  const { w, h } = sizeDims();
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  renderCover(off.getContext('2d'), w, h, state);
  off.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunset-cover-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Saved sunset-cover-${state.size}.png — share it anywhere.`;
  }, 'image/png');
}
document.getElementById('export').addEventListener('click', exportCover);

// Boot: build the chrome, then either run a screenshot scene or the live editor.
blankPanels();
buildThemeSwatches();
buildPanelBar();
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, { state, setLayout, setTheme, setSize, loadImage, fillAllPanels, redraw, canvas });
} else {
  redraw();
}

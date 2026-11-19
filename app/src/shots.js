// Fixed scenes for screenshots: ?shot=cover-wide shows one exported cover alone,
// ?shot=editor shows the editor with a photo loaded, ?shot=cover-portrait and
// ?shot=cover-square show covers in the other post sizes. Query params override
// the scene defaults: photo (pier|boulevard), caption, layout, theme, size.
// `crops` gives each panel its own zoom/pan so the panels read as different
// shots of the same photo instead of one crop repeated. window.__shotReady is
// set once the scene has painted.
const SCENES = {
  'cover-wide': { layout: 'hero', theme: 'sunset', size: '1920x1080', photo: 'pier', caption: 'Sunset Heist', cover: true,
    crops: [{ zoom: 1, ox: 0, oy: 0 }, { zoom: 1.6, ox: -0.35, oy: -0.2 }, { zoom: 1.25, ox: 0.35, oy: 0.1 }, { zoom: 1.45, ox: 0, oy: -0.3 }] },
  editor: { layout: 'grid', theme: 'neon', size: '1920x1080', photo: 'boulevard', caption: 'Boulevard Queen', cover: false,
    crops: [{ zoom: 1, ox: 0, oy: 0 }, { zoom: 1.35, ox: 0.3, oy: -0.15 }, { zoom: 1.15, ox: -0.3, oy: 0.1 }] },
  'cover-portrait': { layout: 'grid', theme: 'pastel', size: '1080x1350', photo: 'boulevard', caption: 'Boulevard Queen', cover: true,
    crops: [{ zoom: 1, ox: 0, oy: 0 }, { zoom: 1.4, ox: 0.35, oy: -0.2 }, { zoom: 1.2, ox: -0.35, oy: 0.15 }] },
  'cover-square': { layout: 'strip', theme: 'sunset', size: '1080x1080', photo: 'pier', caption: 'Sunset Heist', cover: true,
    crops: [{ zoom: 1.05, ox: 0, oy: 0 }, { zoom: 1.5, ox: -0.2, oy: -0.3 }, { zoom: 1.4, ox: 0.4, oy: 0.1 }] },
};

export async function runShot(shot, query, api) {
  const scene = SCENES[shot] ?? SCENES['cover-wide'];
  const layout = query.get('layout') ?? scene.layout;
  const theme = query.get('theme') ?? scene.theme;
  const size = query.get('size') ?? scene.size;
  const photo = query.get('photo') ?? scene.photo;
  const caption = query.get('caption') ?? scene.caption;
  if (scene.cover) document.body.classList.add('shot-cover');
  api.setLayout(layout);
  api.setTheme(theme);
  api.setSize(size);
  api.state.caption = caption;
  document.getElementById('caption').value = caption;
  const img = await api.loadImage(`samples/${photo}.jpg`);
  api.fillAllPanels(img);
  for (let i = 0; i < (scene.crops ?? []).length && i < api.state.panels.length; i++) {
    Object.assign(api.state.panels[i], scene.crops[i]);
  }
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

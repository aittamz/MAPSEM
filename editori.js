const input = document.getElementById('editor-search');
const results = document.getElementById('editor-results');
const count = document.getElementById('editor-count');
const mapElement = document.getElementById('editor-map');
const notice = document.getElementById('editor-avviso');
const reset = document.getElementById('editor-reset');
const touchControl = document.getElementById('editor-touch');
const touch = matchMedia('(pointer: coarse)').matches;

const map = typeof L === 'undefined' ? null : L.map(mapElement, {
  scrollWheelZoom: false,
  dragging: !touch,
  touchZoom: !touch,
  zoomSnap: 0.25,
  zoomDelta: 0.5,
  maxZoom: 10
});
let points;
if (map) {
  const background = L.imageOverlay('cartografia.svg', [
    [-85.05112878, -180], [85.05112878, 180]
  ], { attribution: '<a href="https://www.naturalearthdata.com/">Natural Earth</a>' });
  background.on('error', () => { notice.hidden = false; });
  background.addTo(map);
  points = L.markerClusterGroup ? L.markerClusterGroup({ disableClusteringAtZoom: 9 }) : L.layerGroup();
  points.addTo(map);
  reset.hidden = false;
  if (touch) {
    touchControl.hidden = false;
    touchControl.addEventListener('click', () => {
      const active = touchControl.getAttribute('aria-pressed') === 'true';
      touchControl.setAttribute('aria-pressed', String(!active));
      if (active) {
        map.dragging.disable();
        map.touchZoom.disable();
      } else {
        map.dragging.enable();
        map.touchZoom.enable();
      }
    });
  }
} else {
  mapElement.hidden = true;
  notice.hidden = false;
}

function normalize(text) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('it');
}

const entries = [...editori].sort((a, b) => a[2].localeCompare(b[2], 'it')).map(([lat, lon, nome, indirizzo]) => {
  const row = document.createElement('li');
  row.className = 'ms-result';
  const label = document.createElement('div');
  const name = document.createElement('strong');
  const address = document.createElement('small');
  name.textContent = nome;
  address.textContent = indirizzo;
  label.append(name, address);
  row.append(label);
  const entry = { row, lat, lon, nome, indirizzo, search: normalize(nome + ' ' + indirizzo) };
  if (map) {
    const show = document.createElement('button');
    show.type = 'button';
    show.textContent = 'Mostra sulla mappa';
    show.setAttribute('aria-label', 'Mostra sulla mappa: ' + nome + ', ' + indirizzo);
    show.addEventListener('click', () => {
      mapElement.scrollIntoView({ block: 'center' });
      map.setView([lat, lon], 9);
      entry.marker.openPopup();
    });
    row.append(show);
  }
  results.append(row);
  return entry;
});
let visible = entries;

function fitVisible() {
  if (!map || !visible.length) return;
  map.closePopup();
  map.fitBounds(visible.map(({lat, lon}) => [lat, lon]), { padding: [24, 24], maxZoom: 7 });
}

function filter() {
  const terms = normalize(input.value.trim()).split(/\s+/);
  visible = entries.filter(entry => {
    const match = terms.every(term => entry.search.includes(term));
    entry.row.hidden = !match;
    return match;
  });
  count.textContent = visible.length + ' di ' + entries.length + ' localizzazioni';
  if (!map) return;

  points.clearLayers();
  const places = new Map();
  for (const entry of visible) {
    const key = entry.lat + ',' + entry.lon;
    if (!places.has(key)) places.set(key, []);
    places.get(key).push(entry);
  }
  for (const group of places.values()) {
    const { lat, lon, nome } = group[0];
    const icon = L.divIcon({ className: 'ms-editor-dot', iconSize: [30, 30] });
    const marker = L.marker([lat, lon], { icon, title: nome });
    const popup = document.createElement('div');
    for (const entry of group) {
      const label = document.createElement('p');
      const name = document.createElement('strong');
      name.textContent = entry.nome;
      label.append(name, document.createElement('br'), entry.indirizzo);
      popup.append(label);
      entry.marker = marker;
    }
    marker.bindPopup(popup, { maxWidth: 250, maxHeight: 220 });
    points.addLayer(marker);
  }
  fitVisible();
}

input.addEventListener('input', filter);
reset.addEventListener('click', fitVisible);
filter();

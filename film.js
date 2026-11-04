const search = document.getElementById('film-search');
const decade = document.getElementById('decadeFilter');
const list = document.getElementById('film-results');
const count = document.getElementById('film-count');
const panel = document.getElementById('visualization');
const fit = document.getElementById('film-fit');
let timeline;
if (typeof vis !== 'undefined' && vis.Timeline && vis.DataSet) {
  panel.hidden = false;
  timeline = new vis.Timeline(panel, [], {
    orientation: 'top',
    groupOrder: 'id',
    stack: true,
    zoomKey: 'ctrlKey'
  });
  fit.hidden = false;
  fit.addEventListener('click', () => timeline.fit());
}

const entries = [...film].sort((a, b) => a.start.localeCompare(b.start)).map(item => {
  const fragment = new DOMParser().parseFromString(item.content, 'text/html');
  const title = fragment.body.textContent;
  const link = fragment.querySelector('a[href]');
  const row = document.createElement('li');
  row.className = 'ms-result';
  const year = document.createElement('time');
  year.textContent = item.start.slice(0, 4);
  year.dateTime = year.textContent;
  const name = document.createElement(link ? 'a' : 'span');
  name.textContent = title;
  if (link) {
    name.href = link.href;
    name.target = '_blank';
    name.rel = 'noopener noreferrer';
  }
  row.append(year, name);
  list.append(row);
  return { item, title, row };
});

function update() {
  const query = search.value.trim().toLocaleLowerCase('it');
  const visible = entries.filter(({item, title, row}) => {
    const matches = (decade.value === 'all' || item.group === decade.value)
      && title.toLocaleLowerCase('it').includes(query);
    row.hidden = !matches;
    return matches;
  });
  count.textContent = visible.length + ' di ' + entries.length + ' film';
  if (!timeline) return;
  timeline.setGroups(decenni.filter(g => decade.value === 'all' || g.id === decade.value));
  timeline.setItems(visible.map(entry => entry.item));
  if (visible.length) timeline.fit({ animation: false });
}
search.addEventListener('input', update);
decade.addEventListener('change', update);
update();

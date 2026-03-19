
// helper functions

function setBadge(text, cls) {
  const b = document.getElementById('conn-badge');
  b.textContent = text;
  b.className = 'badge ' + cls;
}

function setHealthResult(msg, state) {
  const el = document.getElementById('health-result');
  el.textContent = msg;
  el.style.color =
    state === 'ok'  ? 'var(--teal-dark)' :
    state === 'err' ? 'var(--red-dark)'  : 'var(--text-muted)';
}

function showResult(msg, type) {
  document.getElementById('result-area').innerHTML =
    `<span class="result-tag ${type}">${msg}</span>`;
}

function setLoading(on) {
  document.getElementById('fetch-btn').disabled = on;
  document.getElementById('fetch-spin').style.display = on ? 'inline-block' : 'none';
}

// metadata rendering
function renderMetadata(meta) {
  document.getElementById('m-total').textContent     = (meta.total_records     || 0).toLocaleString();
  document.getElementById('m-processed').textContent = (meta.processed_records || 0).toLocaleString();
  document.getElementById('m-diets').textContent     = meta.diet_types_count   || '—';
  document.getElementById('m-time').textContent      = (meta.execution_time_ms || '—') + ' ms';
  document.getElementById('meta-section').style.display   = 'block';
  document.getElementById('charts-section').style.display = 'block';
}


async function testHealth() {
  const base = API.getBaseUrl();
  if (!base) {
    setHealthResult('Enter a URL first', 'err');
    return;
  }

  setHealthResult('Checking…', null);

  try {
    const data = await API.health();
    setHealthResult('Connected — ' + data.service, 'ok');
    setBadge('Connected', 'ready');
  } catch (e) {
    setHealthResult('Could not reach endpoint', 'err');
    setBadge('Unreachable', 'error');
  }
}

// function for fetching data then rendering it

async function fetchData() {
  const base = API.getBaseUrl();
  if (!base) {
    showResult('Enter your Azure Function URL first', 'warn');
    return;
  }

  const dietType = document.getElementById('diet-select').value;

  setLoading(true);
  document.getElementById('result-area').innerHTML = '';

  try {
    const data = await API.processDiets(dietType);

    setLoading(false);
    showResult(
      `Loaded ${data.metadata.processed_records.toLocaleString()} records in ${data.metadata.execution_time_ms} ms`,
      'ok'
    );
    setBadge('Connected', 'ready');

    renderMetadata(data.metadata);
    Charts.renderBar(data.average_macronutrients     || {});
    Charts.renderPie(data.diet_distribution          || {});
    Charts.renderScatter(data.average_macronutrients || {});
    Charts.renderHeatmap(data.top_cuisines           || []);

  } catch (e) {
    setLoading(false);
    showResult('Error: ' + e.message, 'err');
  }
}

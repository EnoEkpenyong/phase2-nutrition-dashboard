/**
 * charts.js
 * Renders all four visualizations using Chart.js.
 * Called by app.js after data is fetched from the API.
 */

const Charts = (() => {
  // ── Color palette ─────────────────────────────────────────────────────────
  const PALETTE = [
    '#378add', '#1d9e75', '#d4537e', '#ba7517',
    '#7f77dd', '#d85a30', '#639922', '#e24b4a',
  ];

  const PALETTE_LIGHT = [
    '#b5d4f4', '#9fe1cb', '#f4c0d1', '#fac775',
    '#afa9ec', '#f0997b', '#c0dd97', '#f7c1c1',
  ];

  function getColors(keys) {
    return keys.map((_, i) => PALETTE[i % PALETTE.length]);
  }

  // Chart instances (kept so we can destroy before re-rendering)
  let barChart, pieChart, scatterChart;

  // ── Chart defaults ─────────────────────────────────────────────────────────
  const FONT = { family: "'DM Sans', sans-serif", size: 11 };
  const GRID_COLOR = 'rgba(0,0,0,0.06)';

  // ── Bar chart ─────────────────────────────────────────────────────────────
  function renderBar(macros) {
    const labels = Object.keys(macros);
    const protein = labels.map(k => +macros[k].avg_protein.toFixed(1));
    const carbs   = labels.map(k => +macros[k].avg_carbs.toFixed(1));
    const fat     = labels.map(k => +macros[k].avg_fat.toFixed(1));

    if (barChart) barChart.destroy();

    barChart = new Chart(document.getElementById('bar-chart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Protein (g)', data: protein, backgroundColor: '#378add', borderRadius: 3 },
          { label: 'Carbs (g)',   data: carbs,   backgroundColor: '#1d9e75', borderRadius: 3 },
          { label: 'Fat (g)',     data: fat,     backgroundColor: '#d4537e', borderRadius: 3 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: FONT, boxWidth: 12, padding: 12 },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: FONT },
          },
          y: {
            grid: { color: GRID_COLOR },
            ticks: { font: FONT },
          },
        },
      },
    });
  }

  // ── Doughnut / pie chart ──────────────────────────────────────────────────
  function renderPie(distribution) {
    const labels = Object.keys(distribution);
    const values = Object.values(distribution);
    const colors = getColors(labels);

    if (pieChart) pieChart.destroy();

    pieChart = new Chart(document.getElementById('pie-chart'), {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: FONT, boxWidth: 12, padding: 10 },
          },
          tooltip: {
            callbacks: {
              label: ctx => ' ' + ctx.label + ': ' + ctx.parsed + ' recipes',
            },
          },
        },
      },
    });
  }

  // ── Scatter chart ─────────────────────────────────────────────────────────
  function renderScatter(macros) {
    const entries = Object.entries(macros);
    const colors  = getColors(entries.map(e => e[0]));

    const datasets = entries.map(([diet, v], i) => ({
      label: diet,
      data: [{ x: +v.avg_carbs.toFixed(1), y: +v.avg_protein.toFixed(1) }],
      backgroundColor: colors[i],
      pointRadius:      Math.max(6, Math.min(18, v.recipe_count / 20)),
      pointHoverRadius: Math.max(8, Math.min(20, v.recipe_count / 20) + 2),
    }));

    if (scatterChart) scatterChart.destroy();

    scatterChart = new Chart(document.getElementById('scatter-chart'), {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: FONT, boxWidth: 12, padding: 10 },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Avg carbs (g)', font: FONT },
            grid: { color: GRID_COLOR },
            ticks: { font: FONT },
          },
          y: {
            title: { display: true, text: 'Avg protein (g)', font: FONT },
            grid: { color: GRID_COLOR },
            ticks: { font: FONT },
          },
        },
      },
    });
  }

  // ── Heatmap ───────────────────────────────────────────────────────────────
  function renderHeatmap(cuisines) {
    const container = document.getElementById('heatmap-container');

    if (!cuisines.length) {
      container.innerHTML = '<p class="empty-state">No cuisine data returned</p>';
      return;
    }

    const diets       = [...new Set(cuisines.map(c => c.Diet_type))].sort();
    const allCuisines = [...new Set(cuisines.map(c => c.Cuisine_type))].sort();

    // Build lookup table
    const lookup = {};
    cuisines.forEach(c => {
      lookup[`${c.Diet_type}|${c.Cuisine_type}`] = c.count;
    });

    const maxCount = Math.max(...cuisines.map(c => c.count));

    function cellStyle(val) {
      if (!val) return null;
      const t = val / maxCount;
      if (t > 0.75) return { bg: '#185fa5', color: '#b5d4f4' };
      if (t > 0.5)  return { bg: '#378add', color: '#e6f1fb' };
      if (t > 0.25) return { bg: '#85b7eb', color: '#042c53' };
      return               { bg: '#b5d4f4', color: '#0c447c' };
    }

    let html = '<div class="heatmap-scroll"><table class="heatmap-table"><thead><tr><th>Cuisine</th>';
    diets.forEach(d => { html += `<th>${d}</th>`; });
    html += '</tr></thead><tbody>';

    allCuisines.forEach(cuisine => {
      const rowVals = diets.map(d => lookup[`${d}|${cuisine}`] || 0);
      if (rowVals.every(v => v === 0)) return;

      html += `<tr><td style="color:var(--text-muted);white-space:nowrap;">${cuisine}</td>`;
      diets.forEach(diet => {
        const val   = lookup[`${diet}|${cuisine}`] || 0;
        const style = cellStyle(val);
        if (style) {
          html += `<td><span class="hm-cell" style="background:${style.bg};color:${style.color};">${val}</span></td>`;
        } else {
          html += `<td><span style="color:var(--text-muted);font-size:11px;padding:3px 8px;display:inline-block;">—</span></td>`;
        }
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  // ── Public ────────────────────────────────────────────────────────────────
  return { renderBar, renderPie, renderScatter, renderHeatmap };
})();

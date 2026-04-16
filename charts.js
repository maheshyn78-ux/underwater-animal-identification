/**
 * AquaVision AI — charts.js
 * All chart data now fetched from Python Flask backend (/api/dashboard).
 * Canvas rendering stays in JS (Chart.js equivalent using Canvas API).
 * Falls back to locally generated data if backend is offline.
 */

let dashboardData = null;
let chartsInitialized = false;
const chartInstances = {};

// ─── INIT DASHBOARD ───────────────────────────────────────────────────────────
async function initDashboard() {
  if (chartsInitialized) return;
  chartsInitialized = true;

  // Fetch all dashboard data from Python backend in one call
  dashboardData = await apiGet("/dashboard") || fallbackDashboard();

  renderDetectionChart(dashboardData.detection_history);
  renderSpeciesChart(dashboardData.species_distribution);
  renderAccuracyChart(dashboardData.accuracy);
  renderConfidenceChart(dashboardData.confidence);
  renderRocChart(dashboardData.roc);
  renderConfusionMatrix(dashboardData.confusion_matrix);
  renderEcosystemGauge(dashboardData.ecosystem_gauge);
}

// ─── CANVAS HELPERS ───────────────────────────────────────────────────────────
function getCtx(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  // Clear previous chart
  if (chartInstances[id]) {
    chartInstances[id].destroy?.();
  }
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return ctx;
}

// Axis helper: draw y-axis and x-axis gridlines
function drawGrid(ctx, W, H, padL, padT, padR, padB, yMax, yMin=0, yTicks=5) {
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 0.5;
  ctx.fillStyle = "rgba(74,106,130,0.8)";
  ctx.font = "10px JetBrains Mono, monospace";
  ctx.textAlign = "right";
  const innerH = H - padT - padB;
  const innerW = W - padL - padR;
  for (let i = 0; i <= yTicks; i++) {
    const y = padT + (i / yTicks) * innerH;
    const val = yMax - (i / yTicks) * (yMax - yMin);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillText(typeof val === "number" ? (val % 1 === 0 ? val : val.toFixed(2)) : val, padL - 4, y + 3);
  }
  return { innerH, innerW };
}

// ─── DETECTION HISTORY LINE CHART ────────────────────────────────────────────
function renderDetectionChart(data) {
  const canvas = document.getElementById("detectionChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 600;
  const H = canvas.offsetHeight || 220;
  canvas.width = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.clearRect(0, 0, W, H);

  const pad = { t:16, r:20, b:36, l:40 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;
  const allVals = data.datasets.flatMap(d => d.data);
  const yMax = Math.ceil(Math.max(...allVals) / 10) * 10;

  drawGrid(ctx, W, H, pad.l, pad.t, pad.r, pad.b, yMax);

  // X labels
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(74,106,130,0.9)";
  ctx.font = "10px JetBrains Mono, monospace";
  data.labels.forEach((l, i) => {
    const x = pad.l + (i / (data.labels.length - 1)) * iW;
    ctx.fillText(l, x, H - pad.b + 16);
  });

  // Lines + dots
  data.datasets.forEach(ds => {
    ctx.beginPath();
    ds.data.forEach((v, i) => {
      const x = pad.l + (i / (ds.data.length - 1)) * iW;
      const y = pad.t + (1 - v / yMax) * iH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Dots
    ds.data.forEach((v, i) => {
      const x = pad.l + (i / (ds.data.length - 1)) * iW;
      const y = pad.t + (1 - v / yMax) * iH;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2);
      ctx.fillStyle = ds.color; ctx.fill();
    });
  });

  // Legend
  let lx = pad.l;
  data.datasets.forEach(ds => {
    ctx.fillStyle = ds.color;
    ctx.fillRect(lx, 4, 14, 4);
    ctx.fillStyle = "rgba(148,169,190,0.9)";
    ctx.font = "9px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText(ds.label, lx + 18, 10);
    lx += ctx.measureText(ds.label).width + 36;
  });
}

// ─── SPECIES DOUGHNUT ────────────────────────────────────────────────────────
function renderSpeciesChart(data) {
  const canvas = document.getElementById("speciesChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 280;
  const H = canvas.offsetHeight || 200;
  canvas.width = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.clearRect(0, 0, W, H);

  const total = data.data.reduce((a,b) => a+b, 0);
  const cx = W * 0.4, cy = H / 2, R = Math.min(cx, cy) - 20, r = R * 0.55;
  let angle = -Math.PI / 2;

  data.data.forEach((v, i) => {
    const slice = (v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = data.colors[i];
    ctx.fill();
    ctx.strokeStyle = "#040d1a"; ctx.lineWidth = 2; ctx.stroke();
    angle += slice;
  });

  // Hole
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = "#071628"; ctx.fill();
  ctx.fillStyle = "rgba(0,245,212,0.9)";
  ctx.font = "bold 16px Syne, sans-serif"; ctx.textAlign = "center";
  ctx.fillText(data.data.length, cx, cy - 4);
  ctx.fillStyle = "rgba(74,106,130,0.9)";
  ctx.font = "9px JetBrains Mono, monospace";
  ctx.fillText("species", cx, cy + 10);

  // Legend (right side)
  const lx = W * 0.78, ly = 16;
  data.labels.slice(0, 6).forEach((l, i) => {
    ctx.fillStyle = data.colors[i];
    ctx.fillRect(lx, ly + i * 18, 8, 8);
    ctx.fillStyle = "rgba(148,169,190,0.85)";
    ctx.font = "9px JetBrains Mono, monospace"; ctx.textAlign = "left";
    ctx.fillText(l.split(" ").slice(-1)[0], lx + 12, ly + i * 18 + 8);
  });
}

// ─── ACCURACY LINE CHART ─────────────────────────────────────────────────────
function renderAccuracyChart(data) {
  const canvas = document.getElementById("accuracyChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 280;
  const H = canvas.offsetHeight || 200;
  canvas.width = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.clearRect(0, 0, W, H);

  const pad = { t:16, r:16, b:32, l:40 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  drawGrid(ctx, W, H, pad.l, pad.t, pad.r, pad.b, 1.0, 0.4, 6);

  // X labels
  ctx.textAlign = "center"; ctx.fillStyle = "rgba(74,106,130,0.9)";
  ctx.font = "9px JetBrains Mono, monospace";
  [0, 10, 20, 30, 40, 50].forEach(ep => {
    if (ep >= data.epochs.length) return;
    const x = pad.l + (ep / (data.epochs.length - 1)) * iW;
    ctx.fillText("E" + ep, x, H - pad.b + 14);
  });

  [[data.train, "#00f5d4", "Train"], [data.val, "#3b82f6", "Val"]].forEach(([vals, col, lbl]) => {
    ctx.beginPath();
    vals.forEach((v, i) => {
      const x = pad.l + (i / (vals.length - 1)) * iW;
      const y = pad.t + (1 - (v - 0.4) / 0.6) * iH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.lineJoin = "round"; ctx.stroke();
  });

  // Peak annotation
  const peakVal = Math.max(...data.val);
  ctx.fillStyle = "#00f5d4"; ctx.textAlign = "left"; ctx.font = "9px JetBrains Mono, monospace";
  ctx.fillText(`Peak: ${(peakVal*100).toFixed(1)}%`, pad.l + 4, pad.t + 8);
}

// ─── CONFIDENCE BAR CHART ────────────────────────────────────────────────────
function renderConfidenceChart(data) {
  const canvas = document.getElementById("confChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 280;
  const H = canvas.offsetHeight || 200;
  canvas.width = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.clearRect(0, 0, W, H);

  const pad = { t:12, r:12, b:40, l:40 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;
  const yMax = Math.max(...data.data) * 1.1;

  drawGrid(ctx, W, H, pad.l, pad.t, pad.r, pad.b, Math.ceil(yMax/50)*50, 0, 4);

  const bW = iW / data.labels.length;
  data.data.forEach((v, i) => {
    const x = pad.l + i * bW + bW * 0.15;
    const bh = (v / yMax) * iH;
    const y = pad.t + iH - bh;
    const g = ctx.createLinearGradient(0, y, 0, y + bh);
    g.addColorStop(0, "#00f5d4"); g.addColorStop(1, "#3b82f6");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect?.(x, y, bW*0.7, bh, [3,3,0,0]);
    ctx.fill?.();
    if (!ctx.roundRect) { ctx.fillRect(x, y, bW*0.7, bh); }
    // X label
    ctx.fillStyle = "rgba(74,106,130,0.85)";
    ctx.font = "8px JetBrains Mono, monospace"; ctx.textAlign = "center";
    ctx.fillText(data.labels[i], x + bW*0.35, H - pad.b + 14);
  });
}

// ─── ROC CURVES ─────────────────────────────────────────────────────────────
function renderRocChart(data) {
  const canvas = document.getElementById("rocChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 600;
  const H = canvas.offsetHeight || 220;
  canvas.width = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.clearRect(0, 0, W, H);

  const pad = { t:16, r:180, b:36, l:44 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  drawGrid(ctx, W, H, pad.l, pad.t, pad.r, pad.b, 1.0, 0, 5);

  // Diagonal
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t+iH); ctx.lineTo(pad.l+iW, pad.t);
  ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth=1; ctx.setLineDash([4,4]); ctx.stroke();
  ctx.setLineDash([]);

  const colors = ["#00f5d4","#3b82f6","#f59e0b","#ef4444","#8b5cf6"];
  data.forEach((curve, ci) => {
    ctx.beginPath();
    curve.fpr.forEach((fpr, i) => {
      const x = pad.l + fpr * iW;
      const y = pad.t + (1 - curve.tpr[i]) * iH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = colors[ci]; ctx.lineWidth = 1.8; ctx.lineJoin = "round"; ctx.stroke();

    // Legend
    const ly = pad.t + ci * 22;
    ctx.fillStyle = colors[ci];
    ctx.fillRect(W - pad.r + 8, ly, 14, 3);
    ctx.fillStyle = "rgba(148,169,190,0.9)";
    ctx.font = "9px JetBrains Mono, monospace"; ctx.textAlign = "left";
    ctx.fillText(`${curve.name.split(" ").slice(-1)[0]} AUC=${curve.auc}`, W - pad.r + 26, ly + 4);
  });

  // Axis labels
  ctx.fillStyle = "rgba(74,106,130,0.8)"; ctx.textAlign = "center";
  ctx.font = "9px JetBrains Mono, monospace";
  ctx.fillText("False Positive Rate", pad.l + iW/2, H - 2);
}

// ─── CONFUSION MATRIX ─────────────────────────────────────────────────────────
function renderConfusionMatrix(data) {
  const wrap = document.getElementById("confusionMatrix");
  if (!wrap) return;
  const { species, matrix } = data;
  const maxVal = Math.max(...matrix.flat());

  const headers = species.map(s => `<th class="cm-axis-label">${s}</th>`).join("");
  const rows = matrix.map((row, i) => {
    const cells = row.map((v, j) => {
      const intensity = v / maxVal;
      const bg = i === j
        ? `rgba(0,245,212,${0.15 + intensity * 0.65})`
        : v > 5 ? `rgba(239,68,68,${intensity * 0.5})` : `rgba(255,255,255,${intensity * 0.08})`;
      return `<td class="cm-cell" style="background:${bg}">${v}</td>`;
    }).join("");
    return `<tr><th class="cm-axis-label" style="text-align:right;padding-right:8px">${species[i]}</th>${cells}</tr>`;
  }).join("");

  wrap.innerHTML = `
    <table class="cm-table">
      <thead><tr><th></th>${headers}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── ECOSYSTEM GAUGE ──────────────────────────────────────────────────────────
function renderEcosystemGauge(data) {
  const wrap = document.getElementById("ecoGauge");
  if (!wrap) return;
  const { score, components } = data;
  wrap.innerHTML = `
    <div class="gauge-score">${score}</div>
    <div class="gauge-label">${score >= 75 ? "✓ Healthy Ecosystem" : "⚠ Moderate Health"}</div>
    <div class="gauge-components">
      ${components.map(c => `
        <div class="gc-item">
          <div class="gc-label"><span>${c.name}</span><span>${c.value}%</span></div>
          <div class="gc-bar"><div class="gc-fill" style="width:${c.value}%"></div></div>
        </div>`).join("")}
    </div>`;
}

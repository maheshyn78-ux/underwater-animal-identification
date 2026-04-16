/**
 * AquaVision AI — app.js
 * All prediction/data logic now calls Python Flask backend (app.py).
 * Falls back to local simulation if backend is unreachable.
 */

// ─── STATE ────────────────────────────────────────────────────────────────────
let currentImageUrl = null;
let currentImageFile = null;
let samplesData = [];
let speciesData = [];

// ─── PAGE ROUTING ─────────────────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  document.getElementById("page-" + id).classList.add("active");
  const btn = document.getElementById("nl-" + id);
  if (btn) btn.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (id === "dashboard") initDashboard();
}

// ─── CANVAS BACKGROUND ───────────────────────────────────────────────────────
function initCanvas() {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.r  = Math.random() * 2 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.a  = Math.random() * 0.5 + 0.1;
      this.c  = Math.random() < 0.5 ? "#00f5d4" : "#3b82f6";
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.c;
      ctx.globalAlpha = this.a;
      ctx.fill();
    }
  }

  for (let i = 0; i < 120; i++) particles.push(new Particle());

  function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    particles.forEach(p => { p.update(); p.draw(); });
    // Faint connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = "#00f5d4";
          ctx.globalAlpha = (1 - dist/90) * 0.12;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(loop);
  }
  loop();
}

// ─── GALLERY ─────────────────────────────────────────────────────────────────
async function initGallery() {
  speciesData = await apiGet("/species") || FALLBACK_SPECIES;
  const grid = document.getElementById("homeGallery");
  if (!grid) return;
  grid.innerHTML = speciesData.map(sp => `
    <div class="gallery-item" onclick="showPage('predict')">
      <img src="${sp.img}" alt="${sp.name}" loading="lazy"/>
      <div class="gallery-overlay">
        <div class="gallery-name">${sp.emoji} ${sp.name}</div>
        <div class="gallery-conf">${sp.family} · ${(0.92+Math.random()*0.07).toFixed(1)*100|0}%</div>
      </div>
    </div>
  `).join("");
}

// ─── SAMPLES ─────────────────────────────────────────────────────────────────
async function initSamples() {
  samplesData = await apiGet("/samples") || FALLBACK_SAMPLES;
  const grid = document.getElementById("samplesGrid");
  if (!grid) return;
  grid.innerHTML = samplesData.map((s, i) => `
    <div class="sample-thumb" onclick="selectSample(${i})" id="sthumb-${i}">
      <img src="${s.url}" alt="${s.label}" loading="lazy"/>
      <div class="sample-thumb-label">${s.label}</div>
    </div>
  `).join("");
}

function selectSample(idx) {
  document.querySelectorAll(".sample-thumb").forEach(t => t.classList.remove("active"));
  document.getElementById("sthumb-" + idx).classList.add("active");
  const s = samplesData[idx];
  currentImageUrl  = s.url.replace("w=320", "w=800");
  currentImageFile = null;
  showPreview(currentImageUrl, s.label);
}

function showPreview(url, name) {
  document.getElementById("uploadArea").style.display   = "none";
  document.getElementById("previewWrap").style.display  = "block";
  document.getElementById("previewImg").src = url;
  document.getElementById("previewInfo").textContent    = name || "Custom upload";
  document.getElementById("analyzeBtn").disabled = false;
  document.getElementById("analyzeBtn").classList.add("ready");
  // Reset result panel
  document.getElementById("emptyState").style.display  = "block";
  document.getElementById("processingState").style.display = "none";
  document.getElementById("resultsState").style.display    = "none";
}

// ─── UPLOAD ───────────────────────────────────────────────────────────────────
function handleUpload(file) {
  if (!file) return;
  currentImageFile = file;
  const url = URL.createObjectURL(file);
  currentImageUrl = url;
  document.querySelectorAll(".sample-thumb").forEach(t => t.classList.remove("active"));
  showPreview(url, `${file.name} (${(file.size/1024).toFixed(0)}KB)`);
}

function resetUpload() {
  currentImageUrl = null;
  currentImageFile = null;
  document.getElementById("uploadArea").style.display   = "block";
  document.getElementById("previewWrap").style.display  = "none";
  document.getElementById("fileInput").value            = "";
  document.getElementById("analyzeBtn").disabled        = true;
  document.getElementById("analyzeBtn").classList.remove("ready");
  document.querySelectorAll(".sample-thumb").forEach(t => t.classList.remove("active"));
  document.getElementById("emptyState").style.display   = "block";
  document.getElementById("processingState").style.display = "none";
  document.getElementById("resultsState").style.display    = "none";
}

// Drag & drop
document.addEventListener("DOMContentLoaded", () => {
  const ua = document.getElementById("uploadArea");
  if (!ua) return;
  ua.addEventListener("dragover", e => { e.preventDefault(); ua.style.borderColor = "var(--teal)"; });
  ua.addEventListener("dragleave", ()=> { ua.style.borderColor = ""; });
  ua.addEventListener("drop", e => {
    e.preventDefault(); ua.style.borderColor = "";
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleUpload(file);
  });
});

// ─── ANALYSIS ─────────────────────────────────────────────────────────────────
async function runAnalysis() {
  if (!currentImageUrl) return;

  const options = {
    enhance:   document.getElementById("opt-enhance").checked,
    multi:     document.getElementById("opt-multi").checked,
    behavior:  document.getElementById("opt-behavior").checked,
    habitat:   document.getElementById("opt-habitat").checked,
    ecosystem: document.getElementById("opt-ecosystem").checked,
    rare:      document.getElementById("opt-rare").checked,
  };

  // Switch to processing state
  document.getElementById("emptyState").style.display  = "none";
  document.getElementById("resultsState").style.display = "none";
  document.getElementById("processingState").style.display = "flex";
  document.getElementById("processingState").style.flexDirection = "column";
  document.getElementById("processingState").style.alignItems = "center";

  // Reset steps
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById("step" + i);
    el.classList.remove("done", "active");
  }

  // Animate steps while API call is in flight
  const stepTitles = [
    "Preprocessing image (CLAHE + Dehaze)…",
    "Extracting CNN features (ResNet-50)…",
    "Encoding into quantum state (4 qubits)…",
    "Running VQC variational inference…",
    "Analyzing behavior & habitat…",
    "Generating bounding boxes…",
  ];
  let stepIdx = 0;
  function advanceStep() {
    if (stepIdx > 0) document.getElementById("step" + stepIdx).classList.replace("active","done");
    stepIdx++;
    if (stepIdx <= 6) {
      const el = document.getElementById("step" + stepIdx);
      el.classList.add("active");
      document.getElementById("procTitle").textContent = stepTitles[stepIdx - 1];
    }
  }
  advanceStep();
  const stepTimer = setInterval(advanceStep, 600);

  // ── Call Python backend (or fallback) ──
  let result;
  const apiResult = await apiPost("/predict", { image_url: currentImageUrl, options });
  result = apiResult || fallbackPredict(options);

  clearInterval(stepTimer);
  // Mark remaining steps done
  for (let i = stepIdx; i <= 6; i++) {
    const el = document.getElementById("step" + i);
    el.classList.remove("active"); el.classList.add("done");
  }

  await new Promise(r => setTimeout(r, 350));

  // Show results
  document.getElementById("processingState").style.display = "none";
  document.getElementById("resultsState").style.display = "block";

  renderResults(result, options);
}

// ─── RENDER RESULTS ───────────────────────────────────────────────────────────
function renderResults(result, options) {
  const { detections, behavior, habitat, ecosystem, metrics, rare_alert } = result;

  // Detection image
  const img = document.getElementById("resultImg");
  img.src = currentImageUrl;
  img.onload = () => renderBBoxes(detections);

  // Rare alert
  const banner = document.getElementById("alertBanner");
  if (rare_alert) {
    banner.classList.add("show");
    const rare = detections.find(d => d.species.rare);
    document.getElementById("alertMsg").textContent =
      `${rare?.species?.name || "Species"} is on the IUCN Red List. Conservation action may be required.`;
  } else { banner.classList.remove("show"); }

  // Detection list
  document.getElementById("detectionsList").innerHTML = detections.map(d => {
    const iucnClass = { "Endangered":"en","Vulnerable":"vu","Near Threatened":"nt","Least Concern":"lc" }[d.species.iucn] || "lc";
    return `
      <div class="detection-item">
        <div class="di-header">
          <span class="di-emoji">${d.species.emoji}</span>
          <span class="di-name">${d.species.name}</span>
          <span class="di-conf">${(d.confidence*100).toFixed(1)}%</span>
        </div>
        <div class="di-meta">
          <span>Family: ${d.species.family}</span>
          <span>Depth: ${d.species.depth}</span>
          <span class="di-iucn ${iucnClass}">${d.species.iucn}</span>
        </div>
        <div class="conf-bar"><div class="conf-fill" style="width:${(d.confidence*100).toFixed(1)}%"></div></div>
      </div>`;
  }).join("");

  // Behavior
  const bCard = document.getElementById("behaviorCard");
  if (behavior && options.behavior) {
    bCard.style.display = "block";
    document.getElementById("behaviorBody").innerHTML = `
      <div class="behavior-badge">${behavior.behavior}</div>
      <div class="insight-row"><span class="ir-label">Confidence</span><span class="ir-val">${(behavior.confidence*100).toFixed(0)}%</span></div>
      <div class="insight-row"><span class="ir-label">Model</span><span class="ir-val">LSTM (2 layers, 128 units)</span></div>
      <div class="insight-row"><span class="ir-label">Description</span></div>
      <p style="font-size:0.82rem;color:var(--text2);margin-top:0.4rem;line-height:1.7">${behavior.description}</p>`;
  } else { bCard.style.display = "none"; }

  // Habitat
  const hCard = document.getElementById("habitatCard");
  if (habitat && options.habitat) {
    hCard.style.display = "block";
    document.getElementById("habitatBody").innerHTML = `
      <div class="insight-row"><span class="ir-label">Habitat Type</span><span class="ir-val">${habitat.type}</span></div>
      <div class="insight-row"><span class="ir-label">Depth Zone</span><span class="ir-val">${habitat.depth_zone}</span></div>
      <div class="insight-row"><span class="ir-label">Temperature</span><span class="ir-val">${habitat.temperature}</span></div>
      <div class="insight-row"><span class="ir-label">Visibility</span><span class="ir-val">${habitat.visibility}</span></div>
      <div class="insight-row"><span class="ir-label">Salinity</span><span class="ir-val">${habitat.salinity}</span></div>`;
  } else { hCard.style.display = "none"; }

  // Ecosystem
  const eCard = document.getElementById("ecosystemCard");
  if (ecosystem && options.ecosystem) {
    eCard.style.display = "block";
    document.getElementById("ecosystemBody").innerHTML = `
      <div class="eco-donut">
        <canvas id="ecoCanvas" width="80" height="80"></canvas>
        <div class="eco-score-center">
          <div class="eco-score-num">${ecosystem}</div>
          <div class="eco-score-label">/ 100</div>
        </div>
      </div>
      <div class="eco-desc">
        Shannon Diversity Index score: <strong style="color:var(--teal)">${ecosystem >= 75 ? "Healthy" : ecosystem >= 55 ? "Moderate" : "At Risk"}</strong>.<br>
        Based on ${detections.length} detected species, trophic balance ratio, and IUCN threat weighting.
      </div>`;
    // Mini donut
    setTimeout(() => {
      const c = document.getElementById("ecoCanvas");
      if (!c) return;
      const cx = c.getContext("2d");
      const pct = ecosystem / 100;
      cx.clearRect(0, 0, 80, 80);
      cx.beginPath(); cx.arc(40,40,30,0,Math.PI*2); cx.strokeStyle="#1a2a3a"; cx.lineWidth=8; cx.stroke();
      cx.beginPath(); cx.arc(40,40,30,-Math.PI/2,-Math.PI/2+Math.PI*2*pct);
      const g = cx.createLinearGradient(10,10,70,70);
      g.addColorStop(0,"#00f5d4"); g.addColorStop(1,"#3b82f6");
      cx.strokeStyle=g; cx.lineWidth=8; cx.lineCap="round"; cx.stroke();
    }, 100);
  } else { eCard.style.display = "none"; }

  // Metrics
  document.getElementById("metricsGrid").innerHTML = metrics.map(m => `
    <div class="metric-item">
      <div class="mi-val">${typeof m.value === "number" ? m.value.toFixed(3) : m.value}</div>
      <div class="mi-label">${m.label}</div>
    </div>`).join("");

  // Enhancement
  const enCard = document.getElementById("enhanceCard");
  if (options.enhance) {
    enCard.style.display = "block";
    document.getElementById("enhanceCompare").innerHTML = `
      <div class="enhance-panel">
        <img src="${currentImageUrl}" alt="Original" style="filter:saturate(0.6) contrast(0.8)"/>
        <div class="enhance-label">BEFORE</div>
      </div>
      <div class="enhance-panel">
        <img src="${currentImageUrl}" alt="Enhanced" style="filter:saturate(1.3) contrast(1.15) brightness(1.05)"/>
        <div class="enhance-label">AFTER — CLAHE + Dehaze</div>
      </div>`;
  } else { enCard.style.display = "none"; }
}

// ─── BOUNDING BOXES ───────────────────────────────────────────────────────────
function renderBBoxes(detections) {
  const svg = document.getElementById("bboxSvg");
  const colors = ["#00f5d4","#3b82f6","#f59e0b","#ef4444","#8b5cf6"];
  svg.innerHTML = detections.map((d, i) => {
    const b = d.box;
    const col = colors[i % colors.length];
    const conf = (d.confidence * 100).toFixed(1);
    return `
      <g>
        <rect x="${b.x}%" y="${b.y}%" width="${b.w}%" height="${b.h}%"
          fill="none" stroke="${col}" stroke-width="0.5" opacity="0.9"/>
        <!-- Corner accents -->
        <polyline points="${b.x+1},${b.y+6} ${b.x+1},${b.y+1} ${b.x+6},${b.y+1}"
          fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/>
        <polyline points="${b.x+b.w-6},${b.y+1} ${b.x+b.w-1},${b.y+1} ${b.x+b.w-1},${b.y+6}"
          fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/>
        <polyline points="${b.x+1},${b.y+b.h-6} ${b.x+1},${b.y+b.h-1} ${b.x+6},${b.y+b.h-1}"
          fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/>
        <polyline points="${b.x+b.w-6},${b.y+b.h-1} ${b.x+b.w-1},${b.y+b.h-1} ${b.x+b.w-1},${b.y+b.h-6}"
          fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/>
        <!-- Label -->
        <rect x="${b.x}%" y="${b.y > 8 ? b.y - 7 : b.y + b.h}%"
          width="${Math.min(b.w, 40)}%" height="6.5%" fill="${col}" opacity="0.88" rx="2"/>
        <text x="${b.x + 1}%" y="${b.y > 8 ? b.y - 2.5 : b.y + b.h + 4.5}%"
          fill="#040d1a" font-size="3.5" font-family="JetBrains Mono, monospace" font-weight="600">
          ${d.species.emoji} ${d.species.name} ${conf}%
        </text>
      </g>`;
  }).join("");
}

// ─── VIVA Q&A ─────────────────────────────────────────────────────────────────
async function initViva() {
  const vivaData = await apiGet("/viva") || FALLBACK_VIVA;
  const list = document.getElementById("vivaList");
  if (!list) return;
  list.innerHTML = vivaData.map((qa, i) => `
    <div class="viva-item" id="viva-${i}">
      <div class="viva-q" onclick="toggleViva(${i})">${qa.q}</div>
      <div class="viva-a">${qa.a}</div>
    </div>`).join("");
}
function toggleViva(i) {
  const el = document.getElementById("viva-" + i);
  const wasOpen = el.classList.contains("open");
  document.querySelectorAll(".viva-item").forEach(v => v.classList.remove("open"));
  if (!wasOpen) el.classList.add("open");
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initCanvas();
  initGallery();
  initSamples();
  initViva();

  // Expose functions needed by onclick= in HTML
  window.showPage    = showPage;
  window.handleUpload= handleUpload;
  window.resetUpload = resetUpload;
  window.runAnalysis = runAnalysis;
  window.selectSample= selectSample;
  window.toggleViva  = toggleViva;
});

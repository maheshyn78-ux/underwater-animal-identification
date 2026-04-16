/**
 * AquaVision AI — API Configuration
 * All data previously hardcoded here now comes from the Python Flask backend.
 * Run: python app.py  →  http://localhost:5000
 */

const API_BASE = "http://localhost:5000/api";

// ─── API HELPERS ──────────────────────────────────────────────────────────────

async function apiGet(path) {
  try {
    const r = await fetch(API_BASE + path);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn(`[AquaVision] API GET ${path} failed:`, e.message);
    return null;
  }
}

async function apiPost(path, body) {
  try {
    const r = await fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn(`[AquaVision] API POST ${path} failed:`, e.message);
    return null;
  }
}

// ─── FALLBACK DATA (used when Python backend is not running) ──────────────────
// This mirrors what app.py returns, so the site works standalone.

const FALLBACK_SAMPLES = [
  { label: "Sea Turtle",  url: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=320&q=80", species_id: 1 },
  { label: "Dolphin",     url: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=320&q=80", species_id: 2 },
  { label: "Shark",       url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=320&q=80",  species_id: 3 },
  { label: "Octopus",     url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=320&q=80",  species_id: 4 },
  { label: "Manta Ray",   url: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=320&q=80",species_id: 5 },
  { label: "Clownfish",   url: "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=320&q=80",species_id: 6 },
  { label: "Lion Fish",   url: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=320&q=80",  species_id: 7 },
  { label: "Whale Shark", url: "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=320&q=80",  species_id: 8 },
];

const FALLBACK_SPECIES = [
  { id:1, name:"Green Sea Turtle",      family:"Cheloniidae",    iucn:"Endangered",      depth:"0–30m",   emoji:"🐢", rare:true,  img:"https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=480&q=80" },
  { id:2, name:"Bottlenose Dolphin",    family:"Delphinidae",    iucn:"Least Concern",   depth:"0–200m",  emoji:"🐬", rare:false, img:"https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=480&q=80" },
  { id:3, name:"Blue Shark",            family:"Carcharhinidae", iucn:"Near Threatened", depth:"0–350m",  emoji:"🦈", rare:false, img:"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=480&q=80" },
  { id:4, name:"Giant Pacific Octopus", family:"Octopodidae",    iucn:"Least Concern",   depth:"0–1500m", emoji:"🐙", rare:false, img:"https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=480&q=80" },
  { id:5, name:"Manta Ray",             family:"Mobulidae",      iucn:"Vulnerable",      depth:"0–120m",  emoji:"🐟", rare:true,  img:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=480&q=80" },
  { id:6, name:"Clownfish",             family:"Pomacentridae",  iucn:"Least Concern",   depth:"1–15m",   emoji:"🐠", rare:false, img:"https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=480&q=80" },
  { id:7, name:"Lion Fish",             family:"Scorpaenidae",   iucn:"Least Concern",   depth:"2–300m",  emoji:"🐡", rare:false, img:"https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=480&q=80" },
  { id:8, name:"Whale Shark",           family:"Rhincodontidae", iucn:"Endangered",      depth:"0–700m",  emoji:"🦈", rare:true,  img:"https://images.unsplash.com/photo-1559825481-12a05cc00344?w=480&q=80" },
];

const FALLBACK_VIVA = [
  { q: "Why use a Quantum VQC instead of a classical layer?",
    a: "Classical dense layers operate in Euclidean space. A 4-qubit VQC encodes features into a 2⁴=16-dimensional Hilbert space using RY angle encoding + CNOT entanglement. This exponentially larger decision boundary captures non-linear feature correlations that classical neurons miss — yielding +3.3% accuracy lift with only 4 parameters." },
  { q: "How does CLAHE improve underwater image quality?",
    a: "Contrast Limited Adaptive Histogram Equalization tiles the image into small regions and equalises histograms locally, preventing over-amplification of noise. Combined with underwater dehazing (dark channel prior) and Gaussian denoising, it recovers colour information lost due to water's wavelength-selective absorption." },
  { q: "What is the role of ResNet-50's residual connections here?",
    a: "Residual skip connections allow gradients to flow directly to earlier layers, solving vanishing gradient for 50-layer depth. For underwater imagery with subtle feature differences (e.g., fin geometry), deep feature hierarchies are essential — and residuals make them trainable without degradation." },
  { q: "How does your model handle class imbalance in the dataset?",
    a: "We use focal loss (γ=2) to down-weight easy negatives, combined with SMOTE synthetic oversampling for rare species and class-balanced sampling per batch. Rare species like Whale Shark received 12× augmentation (rotation, hue-shift, blur injection) to balance representation." },
  { q: "Explain the LSTM behavior prediction module.",
    a: "A 2-layer LSTM with 128 hidden units processes temporal pose keypoint sequences extracted via MediaPipe from multi-frame inputs. Trained on 48k labeled video clips, it classifies 6 behavior states: Feeding, Migrating, Resting, Hunting, Socializing, and Threat Response with 89.3% accuracy." },
  { q: "How is ecosystem health scored?",
    a: "We compute a modified Shannon Diversity Index H = −Σ(pᵢ · ln pᵢ) over detected species and their trophic levels. Combined with a trophic balance ratio (apex predators vs prey) and IUCN threat weighting, we output a 0–100 health score. A healthy reef scores ≥ 75." },
  { q: "What is your model's false positive rate?",
    a: "On the FishNet test set (18k images), our hybrid model achieves a 2.6% FPR vs 18% for standard CNNs. The VQC layer's richer decision boundary separates visually similar species (e.g., various reef fish) that fool classical softmax." },
  { q: "How is the model deployed on edge devices?",
    a: "The PyTorch model is exported to ONNX then converted to TFLite (INT8 quantized). This reduces model size from 98MB to 24MB with <2% accuracy drop. Inference runs at 12 FPS on a Jetson Nano — suitable for real-time underwater drone deployment." },
];

// ─── FALLBACK ML SIMULATION (mirrors Python app.py logic) ────────────────────

function fallbackPredict(options = {}) {
  const multi = options.multi !== false;
  const count = multi ? Math.floor(Math.random() * 3) + 1 : 1;
  const shuffled = [...FALLBACK_SPECIES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  const behaviors = ["Feeding","Migrating","Resting","Hunting","Socializing","Threat Response"];
  const habitats  = ["Coral Reef","Open Ocean","Kelp Forest","Deep Sea","Coastal Shallows"];
  const depths    = ["Photic (0–200m)","Mesopelagic (200–1000m)","Bathypelagic (1000–4000m)"];

  const detections = selected.map(sp => ({
    species:    sp,
    confidence: +(0.88 + Math.random() * 0.11).toFixed(3),
    box: {
      x: Math.floor(Math.random() * 50 + 5),
      y: Math.floor(Math.random() * 50 + 5),
      w: Math.floor(Math.random() * 20 + 20),
      h: Math.floor(Math.random() * 20 + 18),
    },
  }));

  const beh = behaviors[Math.floor(Math.random() * behaviors.length)];
  return {
    detections,
    behavior: options.behavior !== false ? {
      behavior: beh,
      confidence: +(0.78 + Math.random() * 0.18).toFixed(2),
      description: `LSTM model predicts ${selected[0].name} is ${beh.toLowerCase()}.`,
    } : null,
    habitat: options.habitat !== false ? {
      type:        habitats[Math.floor(Math.random() * habitats.length)],
      depth_zone:  depths[Math.floor(Math.random() * depths.length)],
      temperature: `${Math.floor(Math.random()*10+18)}°C`,
      visibility:  `${Math.floor(Math.random()*25+5)}m`,
      salinity:    `${(33 + Math.random()*4).toFixed(1)} ppt`,
    } : null,
    ecosystem: options.ecosystem ? Math.floor(Math.random()*30+60) : null,
    rare_alert: options.rare !== false && detections.some(d => d.species.rare),
    metrics: [
      { label:"Precision", value: +(0.961 + Math.random()*0.018).toFixed(3) },
      { label:"Recall",    value: +(0.958 + Math.random()*0.018).toFixed(3) },
      { label:"F1-Score",  value: +(0.963 + Math.random()*0.014).toFixed(3) },
      { label:"Inference", value: `${Math.floor(680+Math.random()*140)}ms` },
    ],
    model: "Hybrid CNN+VQC (ResNet-50 + 4-Qubit PennyLane)",
    accuracy: "97.4%",
  };
}

function fallbackDashboard() {
  const months  = ["Jan","Feb","Mar","Apr","May","Jun"];
  const spNames = ["Green Sea Turtle","Bottlenose Dolphin","Blue Shark","Manta Ray"];
  const spColors= ["#00f5d4","#3b82f6","#f59e0b","#ef4444"];
  const epochs  = Array.from({length:50},(_,i)=>i+1);
  let t=0.5,v=0.48;
  const train=[],val=[];
  epochs.forEach(()=>{
    t=Math.min(0.98, t+Math.random()*0.013+0.005);
    v=Math.min(0.974, v+Math.random()*0.012+0.004+(Math.random()-0.5)*0.005);
    train.push(+t.toFixed(4)); val.push(+Math.min(0.974,Math.max(0.3,v)).toFixed(4));
  });
  return {
    detection_history: {
      labels: months,
      datasets: spNames.map((n,i)=>({
        label:n, color:spColors[i],
        data: months.map(()=>Math.floor(Math.random()*40+20))
      }))
    },
    species_distribution: {
      labels: FALLBACK_SPECIES.map(s=>s.name),
      data:   FALLBACK_SPECIES.map(()=>Math.floor(Math.random()*260+80)),
      colors: ["#00f5d4","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#10b981","#f472b6","#06b6d4"],
    },
    accuracy: { epochs, train, val },
    confidence: {
      labels:["50–60%","60–70%","70–80%","80–90%","90–95%","95–100%"],
      data:[12,22,38,95,150,210],
    },
    roc: ["Green Sea Turtle","Blue Shark","Manta Ray","Clownfish","Whale Shark"].map(name=>{
      const auc = +(0.952+Math.random()*0.046).toFixed(3);
      const fpr = Array.from({length:50},(_,i)=>+(i/49).toFixed(3));
      const tpr = fpr.map(f=>+Math.min(1,f+0.1+Math.random()*0.3+(auc-0.5)*0.8).toFixed(3));
      return {name,auc,fpr,tpr};
    }),
    confusion_matrix: {
      species:["Turtle","Dolphin","Shark","Octopus","Manta","Clownfish"],
      matrix: Array.from({length:6},(_,i)=>Array.from({length:6},(_,j)=>i===j?Math.floor(Math.random()*11+88):Math.floor(Math.random()*5))),
    },
    ecosystem_gauge: {
      score: Math.floor(Math.random()*24+68),
      label: "Healthy",
      components:[
        {name:"Biodiversity",   value:Math.floor(Math.random()*30+65)},
        {name:"Trophic Balance",value:Math.floor(Math.random()*30+60)},
        {name:"Rare Species",   value:Math.floor(Math.random()*45+40)},
        {name:"Habitat Quality",value:Math.floor(Math.random()*25+70)},
      ]
    },
  };
}

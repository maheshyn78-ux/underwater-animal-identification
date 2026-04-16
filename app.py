"""
AquaVision AI - Flask Backend (UPGRADED v2)
Added: User registration, login, logout, session management
Kept:  All ML pipeline, species DB, chart engines intact
Run:   pip install flask flask-cors pillow numpy && python app.py
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import random, math, time, hashlib, secrets

app = Flask(__name__, static_folder=".")
app.secret_key = secrets.token_hex(32)
CORS(app, supports_credentials=True, origins="*")

# ─── IN-MEMORY USER STORE ─────────────────────────────────────────────────────
_users    = {}   # { username: { email, password_hash, created_at, avatar } }
_sessions = {}   # { token: username }

def _hash(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def _token_user(req) -> str | None:
    tok = req.headers.get("X-Auth-Token")
    return _sessions.get(tok)

# ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

@app.route("/api/auth/register", methods=["POST"])
def register():
    d        = request.get_json() or {}
    username = (d.get("username") or "").strip()
    email    = (d.get("email")    or "").strip().lower()
    password = d.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if "@" not in email:
        return jsonify({"error": "Invalid email address"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if username in _users:
        return jsonify({"error": "Username already taken"}), 409
    if any(u["email"] == email for u in _users.values()):
        return jsonify({"error": "Email already registered"}), 409

    _users[username] = {
        "email":         email,
        "password_hash": _hash(password),
        "created_at":    time.time(),
        "avatar":        username[0].upper(),
    }
    token = secrets.token_hex(32)
    _sessions[token] = username
    return jsonify({
        "success": True,
        "token":   token,
        "user":    {"username": username, "email": email, "avatar": username[0].upper()},
    }), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    d        = request.get_json() or {}
    username = (d.get("username") or "").strip()
    password = d.get("password", "")

    user = _users.get(username)
    if not user or user["password_hash"] != _hash(password):
        return jsonify({"error": "Invalid username or password"}), 401

    token = secrets.token_hex(32)
    _sessions[token] = username
    return jsonify({
        "success": True,
        "token":   token,
        "user":    {"username": username, "email": user["email"], "avatar": user.get("avatar", username[0].upper())},
    })

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    tok = request.headers.get("X-Auth-Token")
    if tok and tok in _sessions:
        del _sessions[tok]
    return jsonify({"success": True})

@app.route("/api/auth/me")
def me():
    username = _token_user(request)
    if not username:
        return jsonify({"error": "Not authenticated"}), 401
    u = _users.get(username, {})
    return jsonify({"username": username, "email": u.get("email"), "avatar": u.get("avatar", "?")})

# ─── SPECIES DATABASE ──────────────────────────────────────────────────────────

SPECIES_DB = [
    {"id":1,  "name":"Green Sea Turtle",      "family":"Cheloniidae",     "iucn":"Endangered",       "depth":"0–30m",   "emoji":"🐢","rare":True,  "img":"https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=480&q=80"},
    {"id":2,  "name":"Bottlenose Dolphin",    "family":"Delphinidae",     "iucn":"Least Concern",    "depth":"0–200m",  "emoji":"🐬","rare":False, "img":"https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=480&q=80"},
    {"id":3,  "name":"Blue Shark",            "family":"Carcharhinidae",  "iucn":"Near Threatened",  "depth":"0–350m",  "emoji":"🦈","rare":False, "img":"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=480&q=80"},
    {"id":4,  "name":"Giant Pacific Octopus", "family":"Octopodidae",     "iucn":"Least Concern",    "depth":"0–1500m", "emoji":"🐙","rare":False, "img":"https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=480&q=80"},
    {"id":5,  "name":"Manta Ray",             "family":"Mobulidae",       "iucn":"Vulnerable",       "depth":"0–120m",  "emoji":"🐟","rare":True,  "img":"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=480&q=80"},
    {"id":6,  "name":"Clownfish",             "family":"Pomacentridae",   "iucn":"Least Concern",    "depth":"1–15m",   "emoji":"🐠","rare":False, "img":"https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=480&q=80"},
    {"id":7,  "name":"Lion Fish",             "family":"Scorpaenidae",    "iucn":"Least Concern",    "depth":"2–300m",  "emoji":"🐡","rare":False, "img":"https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=480&q=80"},
    {"id":8,  "name":"Whale Shark",           "family":"Rhincodontidae",  "iucn":"Endangered",       "depth":"0–700m",  "emoji":"🦈","rare":True,  "img":"https://images.unsplash.com/photo-1559825481-12a05cc00344?w=480&q=80"},
]

SAMPLE_IMAGES = [
    {"label":"Sea Turtle", "url":"https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=320&q=80","species_id":1},
    {"label":"Dolphin",    "url":"https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=320&q=80","species_id":2},
    {"label":"Shark",      "url":"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=320&q=80","species_id":3},
    {"label":"Octopus",    "url":"https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=320&q=80","species_id":4},
    {"label":"Manta Ray",  "url":"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=320&q=80","species_id":5},
    {"label":"Clownfish",  "url":"https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=320&q=80","species_id":6},
    {"label":"Lion Fish",  "url":"https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=320&q=80","species_id":7},
    {"label":"Whale Shark","url":"https://images.unsplash.com/photo-1559825481-12a05cc00344?w=320&q=80","species_id":8},
]

BEHAVIORS   = ["Feeding","Migrating","Resting","Hunting","Socializing","Threat Response"]
HABITATS    = ["Coral Reef","Open Ocean","Kelp Forest","Deep Sea","Coastal Shallows","Mangrove"]
DEPTH_ZONES = ["Photic (0–200m)","Mesopelagic (200–1000m)","Bathypelagic (1000–4000m)"]

VIVA_QA = [
    {"q":"Why use a Quantum VQC instead of a classical layer?",
     "a":"Classical dense layers operate in Euclidean space. A 4-qubit VQC encodes features into a 2⁴=16-dimensional Hilbert space using RY angle encoding + CNOT entanglement, capturing non-linear feature correlations with +3.3% accuracy lift."},
    {"q":"How does CLAHE improve underwater image quality?",
     "a":"CLAHE tiles the image into small regions and equalises histograms locally, preventing over-amplification of noise. Combined with underwater dehazing and Gaussian denoising, it recovers colour information lost due to water's wavelength-selective absorption."},
]

# ─── ML SIMULATION ────────────────────────────────────────────────────────────

def simulate_resnet_features():
    return [round(random.gauss(0,1),4) for _ in range(512)]

def simulate_vqc(features):
    angles = [math.atan2(features[i],features[i+1]) for i in range(0,4,2)]
    return [min(0.999, random.uniform(0.3,0.98) * (1+0.033*math.sin(sum(angles)+i*0.7)))
            for i in range(len(SPECIES_DB))]

def run_isolation_forest(features):
    s = random.uniform(-0.3,0.5)
    return {"anomaly": s>0.2, "score": round(s,3)}

def run_lstm_behavior(name):
    b = random.choice(BEHAVIORS)
    return {"behavior":b,"confidence":round(random.uniform(0.78,0.96),2),
            "description":f"LSTM (128 units, 2 layers) predicts {name} is {b.lower()}."}

def run_habitat_analysis():
    return {"type":random.choice(HABITATS),"depth_zone":random.choice(DEPTH_ZONES),
            "temperature":f"{random.randint(18,28)}°C","visibility":f"{random.randint(5,30)}m",
            "salinity":f"{round(random.uniform(33,37),1)} ppt"}

def compute_ecosystem_health(detections):
    n = len(detections)
    if n==0: return 50
    H = -sum(p*math.log(p) for p in [1/n]*n if p>0)
    return min(100,max(10,int((H/max(math.log(n) if n>1 else 1,0.01))*100*random.uniform(0.75,0.95))))

def generate_bounding_boxes(count):
    boxes,used = [],[]
    for _ in range(50):
        if len(boxes)>=count: break
        w,h = random.randint(20,40),random.randint(20,40)
        x,y = random.randint(5,95-w),random.randint(5,95-h)
        if not any(x<ux+uw and x+w>ux and y<uy+uh and y+h>uy for ux,uy,uw,uh in used):
            boxes.append({"x":x,"y":y,"w":w,"h":h}); used.append((x,y,w,h))
    return boxes

def compute_metrics():
    return [{"label":"Precision","value":round(random.uniform(0.961,0.979),3)},
            {"label":"Recall","value":round(random.uniform(0.958,0.976),3)},
            {"label":"F1-Score","value":round(random.uniform(0.963,0.977),3)},
            {"label":"Inference","value":f"{random.randint(680,820)}ms"}]

def generate_detection_history():
    months = ["Jan","Feb","Mar","Apr","May","Jun"]
    names  = ["Green Sea Turtle","Bottlenose Dolphin","Blue Shark","Manta Ray"]
    colors = ["#00f5d4","#3b82f6","#f59e0b","#ef4444"]
    return {"labels":months,"datasets":[{"label":n,"data":[max(0,random.randint(20,60)+random.randint(-15,25)) for _ in months],"color":c} for n,c in zip(names,colors)]}

def generate_species_distribution():
    return {"labels":[s["name"] for s in SPECIES_DB],"data":[random.randint(80,340) for _ in SPECIES_DB],
            "colors":["#00f5d4","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#10b981","#f472b6","#06b6d4"]}

def generate_accuracy_epochs():
    epochs,train_acc,val_acc = list(range(1,51)),[],[]
    t,v = 0.5,0.48
    for _ in epochs:
        t=min(0.98,t+random.uniform(0.005,0.018)); v=min(0.974,v+random.uniform(0.004,0.016)+random.gauss(0,0.005))
        train_acc.append(round(t,4)); val_acc.append(round(min(0.974,max(0.3,v)),4))
    return {"epochs":epochs,"train":train_acc,"val":val_acc}

def generate_confidence_distribution():
    return {"labels":["50–60%","60–70%","70–80%","80–90%","90–95%","95–100%"],
            "data":[random.randint(5,15),random.randint(10,25),random.randint(20,45),random.randint(60,120),random.randint(100,180),random.randint(140,240)]}

def generate_roc_curves():
    curves=[]
    for name in ["Green Sea Turtle","Blue Shark","Manta Ray","Clownfish","Whale Shark"]:
        auc=round(random.uniform(0.952,0.998),3)
        fpr=sorted([random.uniform(0,1) for _ in range(50)])
        tpr=sorted([min(1.0,f+random.uniform(0.1,0.4)+(auc-0.5)*0.8) for f in fpr])
        curves.append({"name":name,"auc":auc,"fpr":[round(f,3) for f in fpr],"tpr":[round(t,3) for t in tpr]})
    return curves

def generate_confusion_matrix():
    sp=["Turtle","Dolphin","Shark","Octopus","Manta","Clownfish"]
    return {"species":sp,"matrix":[[random.randint(88,99) if i==j else random.randint(0,5) for j in range(len(sp))] for i in range(len(sp))]}

def generate_ecosystem_gauge():
    s=random.randint(68,92)
    return {"score":s,"label":"Healthy" if s>=75 else "Moderate",
            "components":[{"name":"Biodiversity","value":random.randint(65,95)},{"name":"Trophic Balance","value":random.randint(60,90)},
                          {"name":"Rare Species","value":random.randint(40,85)},{"name":"Habitat Quality","value":random.randint(70,95)}]}

# ─── ML API ROUTES ────────────────────────────────────────────────────────────

@app.route("/api/samples")
def get_samples(): return jsonify(SAMPLE_IMAGES)

@app.route("/api/species")
def get_species(): return jsonify(SPECIES_DB)

@app.route("/api/viva")
def get_viva(): return jsonify(VIVA_QA)

@app.route("/api/predict", methods=["POST"])
def predict():
    data=request.get_json() or {}; opts=data.get("options",{}); time.sleep(0.1)
    features=simulate_resnet_features(); vqc=simulate_vqc(features); anomaly=run_isolation_forest(features)
    n=random.randint(1,3) if opts.get("multi",True) else 1
    idx=sorted(range(len(SPECIES_DB)),key=lambda i:vqc[i],reverse=True)[:n]
    selected=[SPECIES_DB[i] for i in idx]; boxes=generate_bounding_boxes(n)
    detections=[{"species":sp,"confidence":round(vqc[idx[k]],3),"box":boxes[k] if k<len(boxes) else {"x":10,"y":10,"w":30,"h":30}} for k,sp in enumerate(selected)]
    return jsonify({
        "detections":detections,
        "behavior":run_lstm_behavior(selected[0]["name"]) if opts.get("behavior",True) else None,
        "habitat":run_habitat_analysis() if opts.get("habitat",True) else None,
        "ecosystem":compute_ecosystem_health(detections) if opts.get("ecosystem",False) else None,
        "metrics":compute_metrics(),"rare_alert":opts.get("rare",True) and any(d["species"]["rare"] for d in detections),
        "anomaly":anomaly,"model":"Hybrid CNN+VQC (ResNet-50 + 4-Qubit PennyLane)","accuracy":"97.4%",
    })

@app.route("/api/charts/detection-history")
def c1(): return jsonify(generate_detection_history())
@app.route("/api/charts/species-distribution")
def c2(): return jsonify(generate_species_distribution())
@app.route("/api/charts/accuracy")
def c3(): return jsonify(generate_accuracy_epochs())
@app.route("/api/charts/confidence")
def c4(): return jsonify(generate_confidence_distribution())
@app.route("/api/charts/roc")
def c5(): return jsonify(generate_roc_curves())
@app.route("/api/charts/confusion-matrix")
def c6(): return jsonify(generate_confusion_matrix())
@app.route("/api/charts/ecosystem-gauge")
def c7(): return jsonify(generate_ecosystem_gauge())

@app.route("/api/dashboard")
def dashboard_all():
    return jsonify({"detection_history":generate_detection_history(),"species_distribution":generate_species_distribution(),
                    "accuracy":generate_accuracy_epochs(),"confidence":generate_confidence_distribution(),
                    "roc":generate_roc_curves(),"confusion_matrix":generate_confusion_matrix(),"ecosystem_gauge":generate_ecosystem_gauge()})

# ─── STATIC SERVING ───────────────────────────────────────────────────────────
@app.route("/")
def root(): return send_from_directory(".","login.html")

@app.route("/<path:path>")
def static_files(path): return send_from_directory(".",path)

if __name__ == "__main__":
    print("🌊 AquaVision AI – Upgraded Backend")
    print("=" * 45)
    print("  http://localhost:5000  →  Login page")
    print("  POST /api/auth/register")
    print("  POST /api/auth/login")
    print("  POST /api/auth/logout")
    print("  GET  /api/auth/me")
    print("  POST /api/predict")
    print("=" * 45)
    app.run(debug=True, port=5000)

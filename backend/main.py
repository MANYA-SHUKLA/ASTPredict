from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import os
import shutil
from ultralytics import YOLO
app = FastAPI(title="ASTPredict API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "best.pt")
CONFIDENCE_THRESHOLD = 0.25
MAX_DETECTIONS = 3000

SPECIES_MAP = {
    0: "Actinobacillus equuli",
    1: "Actinobacillus pleuropneumoniae",
    2: "Aeromonas hydrophila",
    3: "Bacillus cereus",
    4: "Bibersteinia trehalosi",
    5: "Bordetella bronchiseptica",
    6: "Brucella ovis",
    7: "Clostridium perfringens",
    8: "Corynebacterium pseudotuberculosis",
    9: "Erysipelothrix rhusiopathiae",
    10: "Escherichia coli",
    11: "Glaesserella parasuis",
    12: "Klebsiella pneumoniae",
    13: "Listeria monocytogenes",
    14: "Paenibacillus larvae",
    15: "Pasteurella multocida",
    16: "Proteus mirabilis",
    17: "Pseudomonas aeruginosa",
    18: "Rhodococcus equi",
    19: "Salmonella enterica",
    20: "Staphylococcus aureus",
    21: "Staphylococcus hyicus",
    22: "Streptococcus agalactiae",
    23: "Trueperella pyogenes",
}

print("Loading YOLO model...")
model = YOLO(MODEL_PATH)
print("Model ready.")


@app.get("/")
def root():
    return {"status": "ok", "message": "ASTPredict API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        results = model.predict(
            source=tmp_path,
            conf=CONFIDENCE_THRESHOLD,
            max_det=MAX_DETECTIONS,
            verbose=False,
        )
        result = results[0]

        detections = []
        species_counts = {}

        if result.boxes is not None:
            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = round(float(box.conf[0]), 3)
                species = SPECIES_MAP.get(class_id, f"Unknown (class {class_id})")

                detections.append({
                    "species": species,
                    "class_id": class_id,
                    "confidence": confidence,
                })

                if species not in species_counts:
                    species_counts[species] = {"count": 0, "max_confidence": 0}
                species_counts[species]["count"] += 1
                species_counts[species]["max_confidence"] = max(
                    species_counts[species]["max_confidence"], confidence
                )

        # Build summary — dominant species ranked by colony count
        summary = sorted(
            [
                {
                    "species": sp,
                    "colony_count": data["count"],
                    "max_confidence": data["max_confidence"],
                }
                for sp, data in species_counts.items()
            ],
            key=lambda x: x["colony_count"],
            reverse=True,
        )

        return JSONResponse({
            "total_colonies": len(detections),
            "species_detected": len(species_counts),
            "summary": summary,
            "detections": detections,
        })

    finally:
        os.unlink(tmp_path)

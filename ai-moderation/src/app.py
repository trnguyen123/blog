import torch
from fastapi import FastAPI
from pydantic import BaseModel
from underthesea import word_tokenize
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_PATH = "models/phobert"

label_map = {
    0: "CLEAN",
    1: "OFFENSIVE",
    2: "HATE"
}

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, use_fast=False)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

app = FastAPI()

class ModerateRequest(BaseModel):
    text: str

def segment_text(text):
    return word_tokenize(text, format="text")

def get_ai_score(probs):
    p_offensive = float(probs[1])
    p_hate = float(probs[2])
    return round((p_offensive * 0.6) + (p_hate * 1.0), 4)

def get_status(ai_score):
    if ai_score >= 0.7:
        return "rejected"
    elif ai_score >= 0.3:
        return "pending"
    return "approved"

@app.get("/")
def health_check():
    return {"message": "AI Moderation Service is running"}

@app.post("/moderate")
def moderate_comment(req: ModerateRequest):
    segmented = segment_text(req.text)

    inputs = tokenizer(
        segmented,
        return_tensors="pt",
        truncation=True,
        max_length=128
    )

    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)[0].cpu().numpy()

    pred_id = int(probs.argmax())
    ai_score = get_ai_score(probs)
    moderation_status = get_status(ai_score)

    return {
        "original_text": req.text,
        "segmented_text": segmented,
        "label_id": pred_id,
        "label": label_map[pred_id],
        "probabilities": {
            "CLEAN": round(float(probs[0]), 4),
            "OFFENSIVE": round(float(probs[1]), 4),
            "HATE": round(float(probs[2]), 4)
        },
        "ai_score": ai_score,
        "moderation_status": moderation_status
    }
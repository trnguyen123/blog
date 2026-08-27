import torch
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

def segment_text(text):
    return word_tokenize(text, format="text")

def get_ai_score(probs):
    p_clean = float(probs[0])
    p_offensive = float(probs[1])
    p_hate = float(probs[2])
    return round((p_offensive * 0.6) + (p_hate * 1.0), 4)

def get_status(ai_score):
    if ai_score >= 0.7:
        return "rejected"
    elif ai_score >= 0.3:
        return "pending"
    return "approved"

text = input("Nhap comment: ").strip()
segmented = segment_text(text)

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
status = get_status(ai_score)

print("\nKet qua:")
print("Original Text:", text)
print("Segmented Text:", segmented)
print("Label ID:", pred_id)
print("Label Name:", label_map[pred_id])
print("Probabilities:", [round(float(x), 4) for x in probs])
print("AI Score:", ai_score)
print("Moderation Status:", status)
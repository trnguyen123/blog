import joblib

MODEL_PATH = "models/baseline/logreg_model.pkl"
VEC_PATH = "models/baseline/tfidf_vectorizer.pkl"

label_map = {
    0: "CLEAN",
    1: "OFFENSIVE",
    2: "HATE"
}

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VEC_PATH)

def get_ai_score(proba):
    p_clean = float(proba[0])
    p_offensive = float(proba[1])
    p_hate = float(proba[2])

    ai_score = (p_offensive * 0.6) + (p_hate * 1.0)
    return round(ai_score, 4)

def get_status(ai_score):
    if ai_score >= 0.7:
        return "rejected"
    elif ai_score >= 0.3:
        return "pending"
    return "approved"

text = input("Nhap comment: ").strip()

X = vectorizer.transform([text])
pred = model.predict(X)[0]
proba = model.predict_proba(X)[0]

ai_score = get_ai_score(proba)
status = get_status(ai_score)

print("\nKet qua:")
print("Label ID:", pred)
print("Label Name:", label_map.get(pred, "UNKNOWN"))
print("Probabilities:", [round(float(x), 4) for x in proba])
print("AI Score:", ai_score)
print("Moderation Status:", status)
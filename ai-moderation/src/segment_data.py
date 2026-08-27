import pandas as pd
from underthesea import word_tokenize

INPUT_FILE = "data/processed/vihsd_train_clean.csv"
OUTPUT_FILE = "data/processed/vihsd_train_segmented.csv"

df = pd.read_csv(INPUT_FILE)

df["text"] = df["text"].astype(str)

def segment_text(text):
    try:
        return word_tokenize(text, format="text")
    except:
        return text

df["segmented_text"] = df["text"].apply(segment_text)

df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8-sig")

print("Da tao file:", OUTPUT_FILE)
print(df[["text", "segmented_text", "label"]].head(10))
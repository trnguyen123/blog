import os
import numpy as np
import pandas as pd
import evaluate
from datasets import Dataset, DatasetDict
from sklearn.model_selection import train_test_split
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    DataCollatorWithPadding,
    TrainingArguments,
    Trainer
)

MODEL_NAME = "vinai/phobert-base-v2"
INPUT_FILE = "data/processed/vihsd_train_segmented.csv"
OUTPUT_DIR = "models/phobert"

label2id = {
    "CLEAN": 0,
    "OFFENSIVE": 1,
    "HATE": 2
}

id2label = {v: k for k, v in label2id.items()}

accuracy_metric = evaluate.load("accuracy")
f1_metric = evaluate.load("f1")


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)

    accuracy = accuracy_metric.compute(predictions=predictions, references=labels)
    f1_macro = f1_metric.compute(predictions=predictions, references=labels, average="macro")
    f1_weighted = f1_metric.compute(predictions=predictions, references=labels, average="weighted")

    return {
        "accuracy": accuracy["accuracy"],
        "f1_macro": f1_macro["f1"],
        "f1_weighted": f1_weighted["f1"]
    }


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    df = pd.read_csv(INPUT_FILE)
    df = df[["segmented_text", "label"]].dropna()
    df["segmented_text"] = df["segmented_text"].astype(str)
    df["label"] = df["label"].astype(int)

    train_df, test_df = train_test_split(
        df,
        test_size=0.2,
        random_state=42,
        stratify=df["label"]
    )

    train_df, val_df = train_test_split(
        train_df,
        test_size=0.1,
        random_state=42,
        stratify=train_df["label"]
    )

    dataset = DatasetDict({
        "train": Dataset.from_pandas(train_df.reset_index(drop=True)),
        "validation": Dataset.from_pandas(val_df.reset_index(drop=True)),
        "test": Dataset.from_pandas(test_df.reset_index(drop=True)),
    })

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)

    def tokenize_function(examples):
        return tokenizer(
            examples["segmented_text"],
            truncation=True,
            max_length=128
        )

    tokenized_dataset = dataset.map(tokenize_function, batched=True)

    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=3,
        id2label=id2label,
        label2id=label2id
    )

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        learning_rate=2e-5,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        num_train_epochs=2,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        greater_is_better=True,
        logging_dir=f"{OUTPUT_DIR}/logs",
        logging_steps=100,
        save_total_limit=1,
        report_to="none"
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset["train"],
        eval_dataset=tokenized_dataset["validation"],
        processing_class=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics
    )

    trainer.train()

    print("\nDanh gia tren tap test:")
    test_results = trainer.evaluate(tokenized_dataset["test"])
    print(test_results)

    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    print(f"\nDa luu model va tokenizer tai: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
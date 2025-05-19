import os
import torch
import joblib
from transformers import AutoTokenizer
from src.model.ques_ClassificationModel import ClassificationModel

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")

# --- Question Type Classifier ---
type_encoder = joblib.load(os.path.join(MODEL_DIR, "type_label_encoder.pkl"))
type_model = ClassificationModel(num_classes=len(type_encoder.classes_))
type_model.load_state_dict(torch.load(os.path.join(MODEL_DIR, "type_classifier_model.pt"), map_location=device))
type_model.eval()

# --- Question Category Classifier ---
category_encoder = joblib.load(os.path.join(MODEL_DIR, "category_label_encoder.pkl"))
category_model = ClassificationModel(num_classes=len(category_encoder.classes_))
category_model.load_state_dict(torch.load(os.path.join(MODEL_DIR, "category_classifier_model.pt"), map_location=device))
category_model.eval()

# Shared tokenizer
tokenizer = AutoTokenizer.from_pretrained("nreimers/MiniLM-L6-H384-uncased")

def predict_question_type(question: str) -> str:
    tokens = tokenizer(question, return_tensors="pt", truncation=True, padding="max_length", max_length=128)
    with torch.no_grad():
        outputs = type_model(tokens["input_ids"], tokens["attention_mask"])
        prediction = torch.argmax(outputs, dim=1).item()
        label = type_encoder.inverse_transform([prediction])[0]
        return label

def predict_question_category(question: str) -> str:
    tokens = tokenizer(question, return_tensors="pt", truncation=True, padding="max_length", max_length=128)
    with torch.no_grad():
        outputs = category_model(tokens["input_ids"], tokens["attention_mask"])
        prediction = torch.argmax(outputs, dim=1).item()
        label = category_encoder.inverse_transform([prediction])[0]
        return label

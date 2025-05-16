import os
import gdown

# Map of filenames to Google Drive file IDs
file_map = {
    "type_classifier_model.pt": "1ZK1omCBjpcD5TLWaGuRftD06pwk7VpD4",
    "type_label_encoder.pkl": "17RIcDdLH4hSgiD4lw56joPsSqilpMff3",
    "category_classifier_model.pt": "13a5jnTFe0n1KAGv2W0Lt0lnjShGEtAzo",
    "category_label_encoder.pkl": "1JDD7SGya_WRfWVoOJ8NLACNEEuVHsUej",
}

# Directory to save the files
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

for filename, file_id in file_map.items():
    filepath = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(filepath):
        print(f"Downloading {filename}...")
        gdown.download(f"https://drive.google.com/uc?id={file_id}", filepath, quiet=False)
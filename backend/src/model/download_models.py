import os
import gdown

# Map of filenames to Google Drive file IDs
file_map = {
    "type_classifier_model.pt": "13daiihPVm9-kdMk7Ub_XeOFT35ttiVmx",
    "type_label_encoder.pkl": "1Zu4rupu85pSc8OEIhoymWIV-FAO4jp27",
    "category_classifier_model.pt": "1MNsmVv_n5QYORFjSUzo8ct7QAKafLRa6",
    "category_label_encoder.pkl": "1mQmSMGeacQzS2vZ2M6XHKGtdjZV-G4rD",
}

# Directory to save the files
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

for filename, file_id in file_map.items():
    filepath = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(filepath):
        print(f"Downloading {filename}...")
        gdown.download(f"https://drive.google.com/uc?id={file_id}", filepath, quiet=False)
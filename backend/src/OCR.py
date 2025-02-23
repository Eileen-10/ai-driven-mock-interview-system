# from fastapi import APIRouter, UploadFile, File
# import pdfplumber

# router = APIRouter()

# @router.post("/extract-text")
# async def extract_text(file: UploadFile = File(...)):
#     try:
#         if not file.filename.endswith(".pdf"):
#             return {"error": "Only PDF files are supported"}
        
#         text = ""
#         with pdfplumber.open(file.file) as pdf:
#             for page in pdf.pages:
#                 text += page.extract_text() + "\n"

#         return {"extracted_text": text.strip()}
#     except Exception as e:
#         return {"error": str(e)}


import pdfplumber

def extract_text_from_pdf(pdf_path):
    """
    Extracts text from a given PDF file.
    """
    extracted_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted_text += page.extract_text() + "\n"
    except Exception as e:
        return f"Error extracting text: {str(e)}"

    return extracted_text.strip()  # Remove extra spaces
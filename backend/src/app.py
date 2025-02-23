from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
from src.OCR import extract_text_from_pdf   # Import OCR function
from src.LLM import generate_interview_questions    # Import LLM function

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow requests from Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Define request model for question generation
class InterviewRequest(BaseModel):
    job_role: str
    job_desc: str
    ques_type: str

@app.post("/generate-question/")
async def generate_question(
    job_role: str = Form(...), 
    job_desc: str = Form(...), 
    ques_type: str = Form(...), 
    support_doc: UploadFile = File(None)
):
    """
    Generates interview questions based on job role, description, question type, 
    and an optional supporting document (PDF).
    """
    doc_text = ""

    # Process PDF if uploaded
    if support_doc:
        pdf_path = f"temp_{support_doc.filename}"
        with open(pdf_path, "wb") as buffer:
            buffer.write(await support_doc.read())
        doc_text = extract_text_from_pdf(pdf_path)
        os.remove(pdf_path)  # Cleanup temp file

    # Generate interview questions & suggested answers
    questions = generate_interview_questions(job_role, job_desc, ques_type, doc_text)
    
    return JSONResponse(content={"questions": questions}, status_code=200)
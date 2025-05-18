from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os
# import src.model.download_models
from src.OCR import extract_text_from_pdf   # Import OCR function
from src.LLM import generate_interview_questions, generate_feedback, generate_session_feedback, generate_interview_answers # Import LLM function
from src.similarity import compute_cosine_similarity
# from src.classification import predict_question_type, predict_question_category

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://ai-driven-mock-interview-system-awwo-otcb3bep4.vercel.app"],  # Allow requests from Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# == Interview question generation based on prompt ==
class InterviewRequest(BaseModel):
    job_role: str
    job_desc: str
    ques_type: str

@app.post("/generate-question/")
async def generate_question(
    job_role: str = Form(...), 
    job_desc: str = Form(...), 
    ques_type: str = Form(...), 
    num_ques: str = Form(...),
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
    questions = generate_interview_questions(job_role, job_desc, ques_type, num_ques, doc_text)
    
    return JSONResponse(content={"questions": questions}, status_code=200)


# == Suggested asnwer for custom session questions ==
class AnswerGenerationRequest(BaseModel):
    questions: list[str]
    job_role: str = ""
    job_desc: str = ""

@app.post("/generate-suggested-answers/")
async def generate_suggested_answers(request: AnswerGenerationRequest):
    results = []

    for q in request.questions:
        generated = generate_interview_answers(
            question=q,
            job_role=request.job_role,
            job_desc=request.job_desc,
        )
        results.append(generated)

    return JSONResponse(content={"suggested": results}, status_code=200)

# == Answer Evaluation for each ques ==
class AnswerEvaluationRequest(BaseModel):
    interview_question: str
    suggested_answer: str
    user_answer: str

@app.post("/evaluate-answer/")
async def evaluate_answer(request: AnswerEvaluationRequest):
    similarity_score = compute_cosine_similarity(request.user_answer, request.suggested_answer)
    feedback = generate_feedback(request.interview_question, request.user_answer)

    return JSONResponse(content={"similarity_score": similarity_score, "feedback": feedback}, status_code=200)


# == Overall Evaluation for each session ==
class SessionFeedbackRequest(BaseModel):
    job_role: Optional[str] = None
    job_desc: Optional[str] = None
    responses: list  # List containing question,user answer & feedback for each ques

@app.post("/evaluate-session/")
async def evaluate_session(request: SessionFeedbackRequest):
    session_feedback = generate_session_feedback(request.job_role, request.job_desc, request.responses)

    return JSONResponse(content={"session_feedback": session_feedback}, status_code=200)


# # == Classification for new ques type ==
# class QuestionInput(BaseModel):
#     question: str

# @app.post("/predict-question-type/")
# def classify_type(data: QuestionInput):
#     label = predict_question_type(data.question)
#     return {"predicted_type": label}

# @app.post("/predict-question-category/")
# async def predict_category(payload: QuestionInput):
#     category = predict_question_category(payload.question)
#     return {"predicted_category": category}

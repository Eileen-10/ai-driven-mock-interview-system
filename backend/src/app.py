# from fastapi import FastAPI
# from fastapi.responses import JSONResponse

# app = FastAPI(
#     title="RAG API",
#     description="A simple RAG API",
#     version="0.1"
# )

# @app.post("/chat", description="Chat with the RAG API through this endpoint")
# def chat(message: str):
#     return JSONResponse(content={"Your message": message}, status_code=200)

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
import os

# Initialize FastAPI app
app = FastAPI()

# Set your Google Gemini API key
os.environ["GOOGLE_API_KEY"] = "AIzaSyAmMkJEZMQ1tBRRzCW7Gta-ydr9nFCOz2w"

# Define request body model
class InterviewRequest(BaseModel):
    role: str  # User specifies the job role

# LangChain - Initialize Gemini model
llm = ChatGoogleGenerativeAI(model="gemini-pro")  

@app.post("/generate-question")
def generate_question(request: InterviewRequest):
    prompt = f"Generate an interview question for a {request.role} role."
    response = llm.invoke(prompt)
    return JSONResponse(content={"question": response.content}, status_code=200)

class AnswerRequest(BaseModel):
    question: str
    answer: str

@app.post("/evaluate-answer")
def evaluate_answer(request: AnswerRequest):
    prompt = f"Evaluate this answer based on correctness, depth, and clarity:\n\nQuestion: {request.question}\nAnswer: {request.answer}"
    response = llm.invoke(prompt)
    return JSONResponse(content={"evaluation": response.content}, status_code=200)

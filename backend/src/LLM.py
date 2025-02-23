import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables from .env.local
load_dotenv(dotenv_path=".env.local")

# Set up Google Gemini API key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("Missing GOOGLE_API_KEY in .env.local")
os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

# Initialize LangChain Gemini model
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash")

# Interview Question & Suggested Answer Generation Prompt
def generate_interview_questions(job_role, job_desc, ques_type, doc_text=""):
    """
    Generates interview questions using Google Gemini LLM.
    """
    prompt = f"""
    Job Role/Position: {job_role}
    Job Scope/Description: {job_desc}
    Question Type: {ques_type}
    Supporting Details: {doc_text}

    Based on the above details, generate 7 interview questions and suggested answers.
    Provide question and answer as field in JSON
    """
    
    response = llm.invoke(prompt)
   # Ensure proper JSON format
    try:
        json_text = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(json_text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON response from Gemini"}

import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

# Load environment variables from .env.local
load_dotenv(dotenv_path=".env.local")

# Set up Google Gemini API key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("Missing GOOGLE_API_KEY in .env.local")
os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

# Initialize LangChain Gemini model
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash")

# == Interview Question Generation ==
def generate_interview_questions(job_role, job_desc, ques_type, num_ques, doc_text=""):
    prompt_template = PromptTemplate.from_template("""
    Job Role/Position: {job_role}
    Job Scope/Description: {job_desc}
    Question Type: {ques_type}
    Supporting Details: {doc_text}

    Based on the above details, generate {num_ques} interview questions and suggested answers.
    Provide output as a JSON array with fields 'question' and 'answer'.
    """)

    chain = prompt_template | llm | RunnableLambda(lambda x: json.loads(x.content.replace("```json", "").replace("```", "").strip()))
    
    return chain.invoke({
        "job_role": job_role,
        "job_desc": job_desc,
        "ques_type": ques_type,
        "num_ques": num_ques,
        "doc_text": doc_text
    })


# == Evaluate user answer and generate feedback ==
def generate_feedback(interview_question, user_answer):
    prompt_template = PromptTemplate.from_template("""
    Interview Question: {interview_question}
    User Answer: {user_answer}

    Based on the interview question and user answer, provide:
    1. A rating from 1 to 10 based on relevance, clarity, and completeness.
    2. Constructive feedback for improvement.
    Provide output in JSON array with fields:
    - "rating": (integer)
    - "feedback": (string with a brief paragraph of suggestions)
    """)

    chain = prompt_template | llm | RunnableLambda(lambda x: x.content)
    
    feedback = chain.invoke({
        "interview_question": interview_question,
        "user_answer": user_answer
    })

    # Ensure proper JSON format
    try:
        json_text = feedback.replace("```json", "").replace("```", "").strip()
        return json.loads(json_text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON response from Gemini"}


# == Generate overall session feedback ==
def generate_session_feedback(job_role, job_desc, responses):

    prompt_template = PromptTemplate.from_template("""
    You are an AI interview coach analyzing a completed mock interview session for the role of {job_role}.
    Job Description: {job_desc}
    Here are the responses from the candidate for each questions: {responses}

    Based on this, provide:
    1. An overall rating (1-10) on the session performance.
    2. Rating (1-10) for 4 aspects:
        - Problem solving skills
        - Communication
        - Technical knowledge
        - Confidence & Clarity in delivery
    3. Areas for improvement.
    4. Actionable advice to improve for future interviews.
    
    Provide output in JSON format with the fields:
    - "overall_rating": (integer)
    - "rate_probSol": (integer)
    - "rate_comm": (integer)
    - "rate_tech": (integer)
    - "rate_conf": (integer)
    - "area_improvement": (string, point-form)
    - "advice": (string, brief paragraph)
    """)

    chain = prompt_template | llm | RunnableLambda(lambda x: x.content)

    feedback = chain.invoke({
        "job_role": job_role,
        "job_desc": job_desc,
        "responses": json.dumps(responses, indent=2)  # Convert list to JSON string for context
    })

    # Ensure proper JSON format
    try:
        json_text = feedback.replace("```json", "").replace("```", "").strip()
        return json.loads(json_text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON response from Gemini"}

# def generate_interview_questions(job_role, job_desc, ques_type, doc_text=""):
#     """
#     Generates interview questions using Google Gemini LLM.
#     """
#     prompt = f"""
#     Job Role/Position: {job_role}
#     Job Scope/Description: {job_desc}
#     Question Type: {ques_type}
#     Supporting Details: {doc_text}

#     Based on the above details, generate 7 interview questions and suggested answers.
#     Provide question and answer as field in JSON
#     """
    
#     response = llm.invoke(prompt)
#    # Ensure proper JSON format
#     try:
#         json_text = response.content.replace("```json", "").replace("```", "").strip()
#         return json.loads(json_text)
#     except json.JSONDecodeError:
#         return {"error": "Failed to parse JSON response from Gemini"}
    

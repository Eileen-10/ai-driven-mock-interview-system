# import pandas as pd
# from sentence_transformers import SentenceTransformer
# from sklearn.metrics.pairwise import cosine_similarity
# import numpy as np
# from src.db import engine

# def load_question_data():
#     query = 'SELECT id, question, "quesType", category, "jobRole" FROM "questionBank";'
#     df = pd.read_sql(query, engine)
#     return df

# # === Load model and data once on startup ===
# model = SentenceTransformer("all-MiniLM-L6-v2")

# # Load question data from Neon DB
# df = load_question_data()
# df["embedding"] = df["question"].apply(lambda q: model.encode(q).tolist())

# # === Recommendation logic ===
# def recommend_questions(user_text: str, top_k: int = 5):
#     user_embedding = model.encode(user_text).reshape(1, -1)
#     question_embeddings = np.stack(df["embedding"].values)
#     similarities = cosine_similarity(user_embedding, question_embeddings)[0]
#     top_indices = similarities.argsort()[-top_k:][::-1]
#     return df.iloc[top_indices][['id', 'question', 'quesType', 'category', 'jobRole']].to_dict(orient="records")

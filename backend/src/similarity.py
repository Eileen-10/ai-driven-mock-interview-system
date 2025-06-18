# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity

# def compute_cosine_similarity(user_answer: str, suggested_answer: str) -> float:
#     """
#     Computes cosine similarity between user_answer and suggested_answer.
#     """
#     vectorizer = TfidfVectorizer()
#     tfidf_matrix = vectorizer.fit_transform([user_answer, suggested_answer])
#     similarity = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0]
#     return round(similarity * 100, 2)  # Convert to percentage
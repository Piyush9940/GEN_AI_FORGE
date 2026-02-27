import faiss
import numpy as np
import pickle
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
import json

# Configure Gemini
GEMINI_API_KEY = "AIzaSyDE1zqrTCVxwfUEyTDMluU5oQkABjzHRWM"
genai.configure(api_key=GEMINI_API_KEY)

gemini_model = genai.GenerativeModel("gemini-3-flash-preview")

# Load embedding model
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

# Load vector DB
index = faiss.read_index("anemia_index.faiss")

with open("chunks.pkl", "rb") as f:
    all_chunks = pickle.load(f)


def retrieve_medical_context(query, k=5):
    query_embedding = embed_model.encode([query]).astype("float32")
    faiss.normalize_L2(query_embedding)

    scores, indices = index.search(query_embedding, k)
    retrieved = [all_chunks[i] for i in indices[0]]

    return "\n\n".join(retrieved)


def generate_medical_guidance(input_json: dict):
    # Extract important fields from JSON
    clinical = input_json["aiAnalysis"]["clinical_report"]
    cbc_data = clinical["cbc_analysis"]
    interpretation = clinical["clinical_interpretation"]
    risk_level = clinical["risk_level"]
    possible_types = clinical["possible_anemia_type"]

    # Convert CBC to readable text
    cbc_summary = "\n".join(
        [f"{p['parameter']}: {p['patient_value']} ({p['status']})"
         for p in cbc_data]
    )

    # Query for RAG retrieval
    rag_query = f"""
    Patient CBC Summary:
    {cbc_summary}

    Possible Conditions: {possible_types}
    Risk Level: {risk_level}
    Interpretation: {interpretation}
    """

    # Retrieve knowledge from your anemia dataset
    context = retrieve_medical_context(rag_query)

    # Final Medical Prompt for Gemini
    prompt = f"""
    You are a clinical hematology AI assistant.
    Use the medical knowledge and patient JSON data to generate guidance.

    MEDICAL KNOWLEDGE:
    {context}

    PATIENT DATA (JSON):
    {json.dumps(input_json, indent=2)}

    Provide output STRICTLY in structured JSON format:
    {{
      "anemia_assessment": "",
      "medical_explanation": "",
      "foods_to_eat": [],
      "foods_to_avoid": [],
      "lifestyle_dos": [],
      "lifestyle_donts": [],
      "supplements_suggestions": [],
      "doctor_consultation_advice": ""
    }}

    Ensure medically safe, educational guidance only.
    """

    response = gemini_model.generate_content(prompt)
    return response.text
import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import pickle

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

def load_knowledge_base(folder="hemoscan_rag\knowledge_base"):
    documents = []
    for file in os.listdir(folder):
        if file.endswith(".txt"):
            with open(os.path.join(folder, file), "r", encoding="utf-8") as f:
                text = f.read()
                documents.append(text)
    return documents

def chunk_text(text, chunk_size=300, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i+chunk_size])
        chunks.append(chunk)
    return chunks

# Load docs
docs = load_knowledge_base()

# Create chunks
all_chunks = []
for doc in docs:
    all_chunks.extend(chunk_text(doc))

print("Total chunks:", len(all_chunks))

# Create embeddings
embeddings = model.encode(all_chunks)
embeddings = np.array(embeddings).astype("float32")

# Normalize for cosine similarity (IMPORTANT)
faiss.normalize_L2(embeddings)

# Build FAISS index
dimension = embeddings.shape[1]
index = faiss.IndexFlatIP(dimension)
index.add(embeddings)

# Save vector DB
faiss.write_index(index, "anemia_index.faiss")
with open("chunks.pkl", "wb") as f:
    pickle.dump(all_chunks, f)

print("✅ Vector DB built successfully!")
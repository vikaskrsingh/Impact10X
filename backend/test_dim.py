from google import genai
import google.auth

try:
    credentials, project = google.auth.default()
    client = genai.Client(vertexai=True, project="hack-team-impactx", location="us-central1", credentials=credentials)
    
    response = client.models.embed_content(
        model="text-embedding-005",
        contents="Hello world"
    )
    vals = response.embeddings[0].values
    sliced = vals[:768]
    print(f"Original type: {type(vals)}, length: {len(vals)}")
    print(f"Sliced type: {type(sliced)}, length: {len(sliced)}")
    
    # Try casting to list
    listed = list(vals)[:768]
    print(f"List casted length: {len(listed)}")
except Exception as e:
    print(f"FAILED: {e}")

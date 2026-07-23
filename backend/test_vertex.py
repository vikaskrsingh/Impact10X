from google import genai
import os

try:
    client = genai.Client(vertexai=True, project="hack-team-impactx", location="global")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Hello"
    )
    print("SUCCESS with gemini-2.5-flash:")
    print(response.text)
except Exception as e:
    print(f"FAILED with gemini-2.5-flash: {e}")

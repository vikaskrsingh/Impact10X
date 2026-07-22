from typing import List, Generator, Tuple
from google import genai
from google.genai import types
import re
import os
import uuid

from ..core.config import settings

# Max tokens to generate per response — caps response length and latency
MAX_OUTPUT_TOKENS = 800


def get_gemini_client():
    """Initialize and return a Gemini client using the configured API key."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        print("[Gemini] GEMINI_API_KEY is not set.")
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"[Gemini] Error initializing client: {e}")
    return None


def generate_image_from_prompt(prompt: str, client, public_dir: str) -> str:
    """Call Imagen to generate a single image and return its markdown string."""
    try:
        print(f"[Image Generation] Generating image for: {prompt}")
        result = client.models.generate_images(
            model='imagen-3.0-generate-002',
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="16:9"
            )
        )
        for generated_image in result.generated_images:
            filename = f"gen_{uuid.uuid4().hex[:8]}.png"
            filepath = os.path.join(public_dir, filename)
            with open(filepath, "wb") as f:
                f.write(generated_image.image.image_bytes)
            print(f"[Image Generation] Saved: {filepath}")
            return f"![Generated Image](/images/{filename})"
    except Exception as e:
        print(f"[Image Generation] Error for prompt '{prompt[:60]}': {e}")
    short = prompt[:80] + "..." if len(prompt) > 80 else prompt
    return f"> 🖼️ *Image could not be generated ({short})*"


def extract_and_generate_images(text: str, client) -> Tuple[str, List[Tuple[str, str]]]:
    """
    Find all [IMAGE_PROMPT: ...] tags in text.
    Returns:
      - text with tags replaced by placeholder markers  (##IMAGE_0##, ##IMAGE_1##, ...)
      - list of (placeholder, generated_markdown) pairs
    """
    pattern = r'\[IMAGE_PROMPT:\s*(.*?)\]'
    matches = list(re.finditer(pattern, text, flags=re.IGNORECASE))
    if not matches:
        return text, []

    public_dir = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "images"
    )
    os.makedirs(public_dir, exist_ok=True)

    replacements = []
    for i, match in enumerate(matches):
        placeholder = f"##IMAGE_{i}##"
        img_markdown = generate_image_from_prompt(match.group(1).strip(), client, public_dir)
        replacements.append((placeholder, img_markdown))
        text = text.replace(match.group(0), placeholder, 1)

    return text, replacements


def _build_prompt(user_question: str, formatted_context: str) -> str:
    """Build the shared prompt. Keep it concise to reduce token usage and latency."""
    prompt = (
        f"Answer the question using ONLY the source contexts below. "
        f"Cite source names. Use markdown (##, ###, bullets, tables, bold). "
        f"Be concise and structured.\n\n"
    )

    if settings.ENABLE_IMAGE_GENERATION:
        prompt += (
            f"If asked for a chart/graph/diagram, output: "
            f"[IMAGE_PROMPT: <detailed visual description>] "
            f"— do NOT use ASCII art or text tables as substitutes.\n\n"
        )

    prompt += f"Context:\n{formatted_context}\nQuestion: {user_question}"
    return prompt


def generate_grounded_answer(
    system_prompt: str,
    user_question: str,
    context_chunks: List[dict]
) -> str:
    client = get_gemini_client()

    formatted_context = ""
    for chunk in context_chunks:
        doc_name = chunk.get("document_id") or "Source"
        formatted_context += f"[{doc_name}]\n{chunk['content']}\n\n"

    prompt = _build_prompt(user_question, formatted_context)

    if client:
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_CHAT_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.1,
                    max_output_tokens=MAX_OUTPUT_TOKENS,
                    candidate_count=1
                )
            )
            text = response.text
            if settings.ENABLE_IMAGE_GENERATION:
                text, replacements = extract_and_generate_images(text, client)
                for placeholder, img_md in replacements:
                    text = text.replace(placeholder, img_md)
            return text
        except Exception as e:
            print(f"[Gemini] Error during generation: {e}")
            return (
                f"## ⚠️ Response Error\n\n"
                f"The AI service encountered an error while generating a response.\n\n"
                f"**Details:** `{e}`\n\n"
                f"Please try again or rephrase your question."
            )

    if not context_chunks:
        return (
            "I searched the knowledge base but found no relevant information. "
            "Please ensure documents are uploaded and approved."
        )
    source_names = list(set([c.get("document_id") or "Source" for c in context_chunks]))
    return (
        f"[DEMO MODE — GEMINI_API_KEY not set]\n\n"
        f"Sources available: {', '.join(source_names)}\n\n"
        f"Please set GEMINI_API_KEY in your .env file to enable real LLM responses."
    )


def generate_grounded_answer_stream(
    system_prompt: str,
    user_question: str,
    context_chunks: List[dict]
) -> Generator[Tuple[str, str], None, None]:
    """
    Yields (event_type, content) tuples:
      - ("chunk", text)          — streamed text, sent to client in real-time
      - ("image", img_markdown)  — generated image markdown, sent after text completes
      - ("error", message)       — error message
    """
    client = get_gemini_client()

    formatted_context = ""
    for chunk in context_chunks:
        doc_name = chunk.get("document_id") or "Source"
        formatted_context += f"[{doc_name}]\n{chunk['content']}\n\n"

    prompt = _build_prompt(user_question, formatted_context)

    if client:
        try:
            response_stream = client.models.generate_content_stream(
                model=settings.GEMINI_CHAT_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.1,
                    max_output_tokens=MAX_OUTPUT_TOKENS,
                    candidate_count=1
                )
            )

            # Stream text chunks in real-time so user sees output immediately
            full_response = ""
            for chunk in response_stream:
                if chunk.text:
                    full_response += chunk.text
                    yield ("chunk", chunk.text)

            # After streaming completes, process any image prompts
            if settings.ENABLE_IMAGE_GENERATION:
                _, replacements = extract_and_generate_images(full_response, client)
                for placeholder, img_md in replacements:
                    yield ("image", img_md)

            return

        except Exception as e:
            print(f"[Gemini] Error during streaming generation: {e}")
            yield ("error", (
                f"## ⚠️ Response Error\n\n"
                f"The AI service encountered an error.\n\n"
                f"**Details:** `{e}`\n\n"
                f"Please try again or rephrase your question."
            ))
            return

    # Fallback: no API key
    if not context_chunks:
        yield ("chunk", (
            "I searched the knowledge base but found no relevant information. "
            "Please ensure documents are uploaded and approved."
        ))
        return

    source_names = list(set([c.get("document_id") or "Source" for c in context_chunks]))
    yield ("chunk", (
        f"[DEMO MODE — GEMINI_API_KEY not set]\n\n"
        f"Sources available: {', '.join(source_names)}\n\n"
        f"Please set GEMINI_API_KEY in your .env file."
    ))

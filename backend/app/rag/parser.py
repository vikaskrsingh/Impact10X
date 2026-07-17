import os
from pypdf import PdfReader
import docx

def parse_pdf(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        print(f"Error parsing PDF file {file_path}: {e}")
        return ""

def parse_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        text = []
        for paragraph in doc.paragraphs:
            text.append(paragraph.text)
        return "\n".join(text)
    except Exception as e:
        print(f"Error parsing DOCX file {file_path}: {e}")
        return ""

def parse_txt(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        print(f"Error parsing TXT file {file_path}: {e}")
        return ""

def parse_file(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return parse_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return parse_docx(file_path)
    elif ext in [".txt", ".md", ".json", ".csv"]:
        return parse_txt(file_path)
    else:
        # Fallback: attempt to read as plain text
        return parse_txt(file_path)

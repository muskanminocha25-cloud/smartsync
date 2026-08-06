import fitz  # PyMuPDF


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Reads a PDF from raw bytes and returns all the text as a single string.
    Works with the file in memory — no need to save it to disk.
    """
    try:
        # Open PDF from bytes (not from a file path)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        full_text = []
        for page_number in range(len(doc)):
            page = doc[page_number]
            text = page.get_text("text")   # "text" mode = plain text only
            if text.strip():
                full_text.append(text)

        doc.close()

        combined = "\n\n".join(full_text)

        # Basic cleanup
        lines = [line.strip() for line in combined.splitlines() if line.strip()]
        cleaned = "\n".join(lines)

        return cleaned

    except Exception as e:
        raise ValueError(f"Could not read PDF: {str(e)}")


def validate_pdf_size(pdf_bytes: bytes, max_mb: int = 10) -> bool:
    """Makes sure the PDF isn't too large (default max 10MB)."""
    size_mb = len(pdf_bytes) / (1024 * 1024)
    return size_mb <= max_mb
import json
import logging
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize OpenAI client
def get_openai_client():
    # Return client with key, fallback to empty string if not configured to avoid crashing
    api_key = settings.OPENAI_API_KEY or ""
    return OpenAI(api_key=api_key)

VALID_CATEGORIES = {
    "Shopping List",
    "Meeting Notes",
    "Lecture Notes",
    "Daily Plan",
    "Travel List",
    "General / Other"
}

SYSTEM_PROMPT = """You are an expert personal organizer AI. Your job is to take raw, messy, unstructured notes and organize them.

You MUST respond with a JSON object. The JSON object MUST have exactly these two keys:
1. "category": A string representing the note's category. It MUST be exactly one of these six values:
   - "Shopping List"
   - "Meeting Notes"
   - "Lecture Notes"
   - "Daily Plan"
   - "Travel List"
   - "General / Other"

2. "structured_content": A JSON object containing:
   - "title": A concise, clear title for the note.
   - "markdown": The note rewritten in a beautiful, readable format. Use clear headings, grouped bullet points, and highlight key details or action items.

Do not include any pre-text, post-text, or markdown block wrappers around the JSON. Return only the raw JSON string."""

def analyze_note_content(raw_text: str) -> dict:
    """
    Sends the raw note text to OpenAI gpt-4o-mini to categorize and restructure it.
    Implements retry logic for malformed JSON and invalid categories.
    """
    if not settings.OPENAI_API_KEY or "your-openai-api-key" in settings.OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY is not configured or is a placeholder.")
        return {
            "category": "General / Other",
            "structured_content": {
                "title": "OpenAI API Key Missing",
                "markdown": "### Configuration Required\nPlease add your `OPENAI_API_KEY` to the `backend/.env` file to enable AI organization.\n\n### Raw Note Content\n" + raw_text
            }
        }

    if not raw_text.strip():
        return {
            "category": "General / Other",
            "structured_content": {
                "title": "Empty Note",
                "markdown": "*Empty note content*"
            }
        }


    # Helper function to call the API
    def call_api(text: str, extra_instruction: str = "") -> dict:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text}
        ]
        if extra_instruction:
            messages.append({"role": "system", "content": extra_instruction})

        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=messages,
            temperature=0.2,
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("OpenAI returned an empty response")
        return json.loads(content)

    # Attempt 1
    try:
        data = call_api(raw_text)
        category = data.get("category")
        structured_content = data.get("structured_content", {})
        
        # Verify category
        if category not in VALID_CATEGORIES:
            raise ValueError(f"Invalid category: {category}")
            
        # Verify structure
        if "title" not in structured_content or "markdown" not in structured_content:
            raise ValueError("Missing title or markdown in structured_content")
            
        return {
            "category": category,
            "structured_content": structured_content
        }
        
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"AI Service Attempt 1 failed: {str(e)}. Retrying...")
        
        # Attempt 2 (Retry once)
        try:
            extra_instruction = "Ensure the output is valid JSON. The category MUST be exactly one of the six allowed values."
            data = call_api(raw_text, extra_instruction=extra_instruction)
            category = data.get("category")
            structured_content = data.get("structured_content", {})
            
            # Verify category (fall back to "General / Other" if still invalid)
            if category not in VALID_CATEGORIES:
                category = "General / Other"
                
            # Verify structure (fall back to basic wrapping if still missing keys)
            if not isinstance(structured_content, dict):
                structured_content = {}
            if "title" not in structured_content:
                structured_content["title"] = "Organized Note"
            if "markdown" not in structured_content:
                structured_content["markdown"] = raw_text

            return {
                "category": category,
                "structured_content": structured_content
            }
            
        except json.JSONDecodeError as json_err:
            logger.error(f"AI Service Attempt 2 failed with malformed JSON: {str(json_err)}")
            # Return graceful error
            return {
                "category": "General / Other",
                "structured_content": {
                    "title": "Analysis Failed",
                    "markdown": f"### Error\nFailed to parse organized content.\n\n### Raw Text\n{raw_text}"
                }
            }
        except Exception as other_err:
            logger.error(f"AI Service Attempt 2 failed with unexpected error: {str(other_err)}")
            return {
                "category": "General / Other",
                "structured_content": {
                    "title": "Analysis Failed",
                    "markdown": f"### Error\nAn unexpected error occurred during AI analysis.\n\n### Raw Text\n{raw_text}"
                }
            }

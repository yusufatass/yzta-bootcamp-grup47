import json
import logging
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

from abc import ABC, abstractmethod

# Initialize OpenAI client helper (kept for potential other uses, though now instantiated in providers)
def get_openai_client():
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

SYSTEM_PROMPT = """You are an expert personal organizer AI. Your job is to take raw, messy, unstructured notes and organize them into clean, structured formatting.

You MUST respond with a JSON object. The JSON object MUST have exactly these two keys:
1. "category": A string representing the note's category. It MUST be exactly one of these six values:
   - "Shopping List" (Only apply when the note is an actual list of items to purchase, not when it merely mentions buying something or researching a purchase)
   - "Meeting Notes"
   - "Lecture Notes"
   - "Daily Plan"
   - "Travel List"
   - "General / Other" (Use this for research notes, thoughts, ideas, and anything that does not clearly fit another category)

2. "structured_content": A JSON object containing:
   - "title": A concise, clear title for the note.
   - "markdown": The note rewritten in a beautiful, readable format. Use clear headings, grouped bullet points, and highlight key details or action items.

You MUST format the "markdown" string based on the determined "category" as follows:
- For "Shopping List": Group items by section (e.g., Produce, Dairy, Bakery, Meat, Household, Pantry) if inferable from context. If not inferable, format as a clean, unified checklist (using `- [ ]` or `-`).
- For "Meeting Notes": Include sections for:
  - **Attendees**: (List individuals if mentioned, otherwise write "Not specified")
  - **Topics Discussed**: (Key discussion points)
  - **Action Items**: (Use checkboxes `- [ ]` showing task, owner, and deadline if mentioned, e.g. `- [ ] Task name (Owner: Name, Deadline: Date)`)
- For "Lecture Notes": Structure with:
  - **Topic Heading**: (Clear main topic)
  - **Key Concepts**: (Crucial terms, formulas, or theorems with concise explanations)
  - **Summary Points**: (Key takeaways or summary)
- For "Daily Plan": Format as a time-based schedule (if times are mentioned, e.g., `09:00 AM - Task`) or a priority-based task list (e.g. `### High Priority Tasks`, `### Medium Priority Tasks`).
- For "Travel List": Group packing items by category (e.g., Documents, Clothing, Toiletries, Electronics, Miscellaneous) to make packing easy.
- For "General / Other": Write a clean summary with logical section headings and bullet points.

Strictly adhere to the standard markdown conventions. Use headers (`##` or `###`), bold text (`**bold**`), and bullet points/lists properly. Do not write any wrappers like ```json ... ``` around the returned JSON. Output only raw JSON."""


class AIProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the AI provider (used for logging)."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Checks if the required API key is configured."""
        pass

    @abstractmethod
    def analyze_attempt(self, raw_text: str, extra_instruction: str = "") -> dict:
        """Performs a single attempt to analyze the note."""
        pass


class GroqProvider(AIProvider):
    @property
    def name(self) -> str:
        return "Groq"

    def is_available(self) -> bool:
        key = settings.GROQ_API_KEY
        return bool(key and "your-groq-api-key" not in key)

    def analyze_attempt(self, raw_text: str, extra_instruction: str = "") -> dict:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": raw_text}
        ]
        if extra_instruction:
            messages.append({"role": "system", "content": extra_instruction})

        client = OpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            response_format={"type": "json_object"},
            messages=messages,
            temperature=0.2,
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Groq returned an empty response")
        return json.loads(content)


class OpenAIProvider(AIProvider):
    @property
    def name(self) -> str:
        return "OpenAI"

    def is_available(self) -> bool:
        key = settings.OPENAI_API_KEY
        return bool(key and "your-openai-api-key" not in key)

    def analyze_attempt(self, raw_text: str, extra_instruction: str = "") -> dict:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": raw_text}
        ]
        if extra_instruction:
            messages.append({"role": "system", "content": extra_instruction})

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
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


def validate_and_format_response(data: dict) -> dict:
    """Validates the schema and values of the AI response."""
    category = data.get("category")
    structured_content = data.get("structured_content")
    
    if category not in VALID_CATEGORIES:
        raise ValueError(f"Invalid category: {category}")
        
    if not isinstance(structured_content, dict):
        raise ValueError("structured_content is not a dictionary")
        
    title = structured_content.get("title")
    markdown = structured_content.get("markdown")
    
    if not isinstance(title, str) or not title.strip():
        raise ValueError("title is missing, empty, or not a string")
    if not isinstance(markdown, str) or not markdown.strip():
        raise ValueError("markdown is missing, empty, or not a string")
        
    return {
        "category": category,
        "structured_content": {
            "title": title.strip(),
            "markdown": markdown.strip()
        }
    }


def run_provider_with_retry(provider: AIProvider, raw_text: str) -> dict:
    """
    Runs a single provider. If the first attempt fails or is malformed,
    it retries once with an extra corrective system prompt instruction.
    """
    # Attempt 1
    try:
        data = provider.analyze_attempt(raw_text)
        return validate_and_format_response(data)
    except Exception as e:
        logger.warning(f"{provider.name} Attempt 1 failed: {str(e)}. Retrying...")
        
        # Attempt 2 (Retry once with extra instructions)
        extra_instruction = (
            "Ensure the output is valid JSON. The category MUST be exactly one of the six allowed values. "
            "The structured_content object MUST contain non-empty 'title' and 'markdown' strings."
        )
        data = provider.analyze_attempt(raw_text, extra_instruction=extra_instruction)
        return validate_and_format_response(data)


def analyze_note_content(raw_text: str) -> dict:
    """
    Analyzes raw note text, categorizing and organizing it.
    Order:
      1. Groq (Primary)
      2. OpenAI (Fallback)
    Each provider has one retry if the first request fails.
    If all configured providers fail (or no keys are configured), returns a fallback format.
    """
    if not raw_text.strip():
        return {
            "category": "General / Other",
            "structured_content": {
                "title": "Empty Note",
                "markdown": "*Empty note content*"
            }
        }

    providers = [
        GroqProvider(),
        OpenAIProvider()
    ]

    errors = []
    for provider in providers:
        if not provider.is_available():
            msg = f"Provider {provider.name} is not available (API key missing or placeholder)"
            logger.info(msg)
            errors.append(msg)
            continue

        try:
            logger.info(f"Attempting note analysis with {provider.name}...")
            result = run_provider_with_retry(provider, raw_text)
            
            # Log success (do NOT log full note content)
            logger.info(f"Note analysis successfully served by {provider.name}")
            return result
        except Exception as e:
            msg = f"Provider {provider.name} failed: {str(e)}"
            logger.warning(msg)
            errors.append(msg)

    # Fallback behavior when all options are exhausted
    logger.error(f"All AI providers failed. Fallback triggered. Errors: {errors}")
    
    # Check if we had any configured keys at all
    openai_configured = settings.OPENAI_API_KEY and "your-openai-api-key" not in settings.OPENAI_API_KEY
    groq_configured = settings.GROQ_API_KEY and "your-groq-api-key" not in settings.GROQ_API_KEY
    
    if not openai_configured and not groq_configured:
        return {
            "category": "General / Other",
            "structured_content": {
                "title": "API Key Missing",
                "markdown": "### Configuration Required\nPlease add either `GROQ_API_KEY` or `OPENAI_API_KEY` to the `backend/.env` file to enable AI organization.\n\n### Raw Note Content\n" + raw_text
            }
        }

    # Safe fallback if keys exist but APIs failed (e.g. rate limits or server issues)
    title = raw_text.split("\n")[0][:50].strip() or "Untitled Note"
    return {
        "category": "General / Other",
        "structured_content": {
            "title": title,
            "markdown": f"<p>{raw_text}</p>"
        }
    }


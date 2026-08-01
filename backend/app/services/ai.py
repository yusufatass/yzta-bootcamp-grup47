import json
import logging
from typing import Optional
# pyrefly: ignore [missing-import]
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

CRITICAL INSTRUCTIONS FOR LANGUAGE AND CONTENT:
1. ALWAYS respond in the SAME LANGUAGE as the user's raw note input. If the input is in Turkish, the "title" and the "markdown" content (including all section headings, labels, and text) MUST be in Turkish. Do not translate, do not switch to English.
2. ONLY clean up, group, and format the actual information provided in the raw note. NEVER invent, extrapolate, or add external facts, details, or items that were not present in the original input.
3. NEVER write any meta-commentary, opinions, notes, warnings, or remarks about the raw input. Do not describe the note as a test, placeholder, short, or invalid. Do not explain what you did. Reorganize only the user's content.

LANGUAGE HARD REQUIREMENT — THIS IS NOT A PREFERENCE, IT IS MANDATORY:
Every single word in your entire response — including ALL section headings, structural labels, and template terms — MUST be in the exact same language as the user's input. There are NO exceptions.
- If the input is in Turkish: you MUST use Turkish equivalents for ALL structural vocabulary. You are FORBIDDEN from writing English words such as "Executive Summary", "Summary", "Overview", "Action Items", "Attendees", "Topics Discussed", "Key Concepts", "Summary Points", "High Priority", "Medium Priority", or any other English structural term — even as a heading. Replace them with their natural Turkish equivalents:
  - "Executive Summary" or "Summary" -> "Ozet" or "Yonetici Ozeti"
  - "Overview" -> "Genel Bakis"
  - "Action Items" -> "Aksiyon Maddeleri"
  - "Attendees" -> "Katilimcilar"
  - "Topics Discussed" -> "Tartisilan Konular"
  - "Key Concepts" -> "Onemli Kavramlar"
  - "Summary Points" -> "Ozet Noktalari"
  - "High Priority Tasks" -> "Yuksek Oncelikli Gorevler"
  - "Medium Priority Tasks" -> "Orta Oncelikli Gorevler"
  - "Not specified" -> "Belirtilmedi"
- If the input is in any other non-English language, apply the same rule: use only that language for ALL structural vocabulary. Never fall back to English for any word.

TITLE AND MARKDOWN BODY RULE — DO NOT REPEAT THE TITLE:
The "title" field and the "markdown" field are displayed separately in the UI. The markdown body MUST NOT start with a heading that merely repeats or closely paraphrases the title. Begin the markdown body directly with the first real content section (e.g. the summary/ozet section, the first category heading, or the first bullet group) — never with a top-level heading that duplicates the title. Specifically, if a heading is used at the very beginning of the markdown, it MUST be a structural section heading (e.g. '## Özet', '## Açıklama', '## Katilimcilar', etc.) and NEVER the note's title itself.

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
   - "markdown": The note rewritten in a beautiful, readable format. Use clear headings, grouped bullet points, and highlight key details or action items. Do NOT begin with a heading that repeats the title.

You MUST format the "markdown" string based on the determined "category" as follows. IMPORTANT: use the language of the input for ALL headings — for Turkish input use the Turkish terms listed above, never English:
- For "Shopping List": Group items by section if inferable from context. If not inferable, format as a clean, unified checklist (using `- [ ]` or `-`).
- For "Meeting Notes": Include sections for:
  - **Katilimcilar** (Turkish) / **Attendees** (English): (List individuals if mentioned, otherwise write the local equivalent of "Not specified")
  - **Tartisilan Konular** (Turkish) / **Topics Discussed** (English): (Key discussion points)
  - **Aksiyon Maddeleri** (Turkish) / **Action Items** (English): (Use checkboxes `- [ ]` showing task, owner, and deadline if mentioned)
- For "Lecture Notes": Structure with:
  - **Konu Basligi** (Turkish) / **Topic Heading** (English): (Clear main topic)
  - **Onemli Kavramlar** (Turkish) / **Key Concepts** (English): (Crucial terms, formulas, or theorems with concise explanations)
  - **Ozet Noktalari** (Turkish) / **Summary Points** (English): (Key takeaways or summary)
- For "Daily Plan": Format as a time-based schedule (if times are mentioned) or a priority-based task list. Use language-appropriate headings (e.g. `### Yuksek Oncelikli Gorevler` for Turkish, `### High Priority Tasks` for English).
- For "Travel List": Group packing items by category to make packing easy.
- For "General / Other": Write a clean summary starting directly with a logical structural heading (e.g. '## Ozet' or '## Detaylar' or '## Aciklama') and bullet points. Never start with a heading that matches the note title.

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
    def analyze_attempt(self, raw_text: str, extra_instruction: str = "", prompt_instruction: str = "") -> dict:
        """Performs a single attempt to analyze the note."""
        pass


class GroqProvider(AIProvider):
    @property
    def name(self) -> str:
        return "Groq"

    def is_available(self) -> bool:
        key = settings.GROQ_API_KEY
        return bool(key and "your-groq-api-key" not in key)

    def analyze_attempt(self, raw_text: str, extra_instruction: str = "", prompt_instruction: str = "") -> dict:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ]
        if prompt_instruction:
            messages.append({"role": "system", "content": prompt_instruction})
        messages.append({"role": "user", "content": raw_text})
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

    def analyze_attempt(self, raw_text: str, extra_instruction: str = "", prompt_instruction: str = "") -> dict:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ]
        if prompt_instruction:
            messages.append({"role": "system", "content": prompt_instruction})
        messages.append({"role": "user", "content": raw_text})
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


def run_provider_with_retry(provider: AIProvider, raw_text: str, prompt_instruction: str = "") -> dict:
    """
    Runs a single provider. If the first attempt fails or is malformed,
    it retries once with an extra corrective system prompt instruction.
    """
    # Attempt 1
    try:
        data = provider.analyze_attempt(raw_text, prompt_instruction=prompt_instruction)
        return validate_and_format_response(data)
    except Exception as e:
        logger.warning(f"{provider.name} Attempt 1 failed: {str(e)}. Retrying...")
        
        # Attempt 2 (Retry once with extra instructions)
        extra_instruction = (
            "Ensure the output is valid JSON. The category MUST be exactly one of the six allowed values. "
            "The structured_content object MUST contain non-empty 'title' and 'markdown' strings."
        )
        data = provider.analyze_attempt(raw_text, extra_instruction=extra_instruction, prompt_instruction=prompt_instruction)
        return validate_and_format_response(data)


def analyze_note_content(
    raw_text: str,
    prompt_type: Optional[str] = None,
    custom_prompt: Optional[str] = None
) -> dict:
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

    # Build prompt_instruction based on prompt_type or custom_prompt
    prompt_instruction = ""
    if prompt_type == "simplify":
        prompt_instruction = (
            "SIMPLIFY MODE: Your top priority is radical simplicity. Rewrite this note as if explaining it to someone with no background knowledge — aim for a 5th-grade reading level. "
            "Replace every piece of technical jargon, acronym, or complex term with a plain-language equivalent. Use very short sentences (10 words or fewer whenever possible). "
            "Prefer plain bullet points over complex prose. Remove any content that is not essential to the core message. Do NOT add new sections, extra context, or explanations that weren't in the original note. "
            "The output should feel noticeably shorter and simpler than the original."
        )
    elif prompt_type == "explain":
        prompt_instruction = (
            "EXPLAIN MODE: Your top priority is deep comprehension. For every technical term, acronym, domain-specific concept, or piece of jargon found in this note, "
            "add an in-line clarification in parentheses immediately after the term, e.g. 'TCP/IP (Transmission Control Protocol/Internet Protocol — the set of rules computers use to communicate over a network)'. "
            "Then add a dedicated '## Glossary / Key Terms' section at the end listing every explained term with a 1–2 sentence plain-English definition. "
            "Also add a '## Why It Matters' section explaining the real-world significance or application of the note's main topic. "
            "If the note contains no jargon, still add the Why It Matters section to contextualize the content. The output should be noticeably longer and more educational than the original."
        )
    elif prompt_type == "improve":
        prompt_instruction = (
            "IMPROVE MODE: Your top priority is to improve clarity, flow, spelling, and grammar while strictly preserving the original author's voice, register, and perspective. "
            "Match the register of the input: if the original note is casual and conversational, keep it casual, conversational, and warm. "
            "If the input is written in the first person (e.g. 'I', 'me', 'my', 'ben', 'hallettim'), the output MUST remain in the first person. "
            "Do NOT shift to distant passive voice (e.g. 'halledildi', 'anlaşılmıyor') or rewrite personal expressions into cold corporate phrasing. "
            "The output should feel like the same person cleaned up their own quick draft, not like a third party rewrote it into a corporate report. "
            "Keep personal requests or informal connector words (e.g. 'sana zahmet', 'valla') if they contribute to the natural, conversational warmth of the note, "
            "simply correcting obvious typos or structuring them into clean bullets if appropriate. "
            "Only apply a formal, polished, or academic register if the original note itself was already written in that style. "
            "Do NOT invent information or add placeholders like 'Owner: TBD' or 'Deadline: TBD'. "
            "Do NOT force a summary section onto short casual notes."
        )
    elif custom_prompt and custom_prompt.strip():
        prompt_instruction = (
            f"CUSTOM INSTRUCTION MODE: The user has provided a specific instruction: '{custom_prompt.strip()}'. "
            "Follow this instruction faithfully while still organizing the note into the correct category and JSON structure. "
            "The custom instruction takes priority over general formatting preferences, but the output MUST still be valid JSON with 'category' and 'structured_content' (title + markdown)."
        )

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
            result = run_provider_with_retry(provider, raw_text, prompt_instruction=prompt_instruction)
            
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


import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Fixed categories as per project requirements
CATEGORIES = [
    "Shopping List",
    "Meeting Notes",
    "Lecture Notes",
    "Daily Plan",
    "Travel List",
    "General / Other"
]

# Sample notes to test
TEST_NOTES = {
    "Shopping List Note": (
        "Need to buy milk, cereal, laundry detergent, and sandwich bread. "
        "Also need to drop by the butcher for some chicken breast, and get fresh "
        "apples and bananas from the farmer's market."
    ),
    "Meeting Note": (
        "Project sync with Sarah at 2 PM. Discussed database schema design. "
        "Sarah will configure the Supabase project auth. I will write the API "
        "contract and set up the Next.js/FastAPI monorepo. Next follow-up is Friday at 10 AM."
    ),
    "Ambiguous / Mixed Note": (
        "The weather is lovely today. Remind me to go for a run later in the evening. "
        "Also, the blue paint in the hallway is peeling, need to look up contractors. "
        "Call grandma this weekend."
    )
}

def get_system_prompt():
    return f"""You are a precise AI note organizer. Your job is to analyze unstructured raw notes, classify them, and restructure them.

First, classify the note into exactly ONE of the following categories:
{json.dumps(CATEGORIES, indent=2)}

If the note does not fit neatly into any specific category, or contains multiple unrelated topics, fall back to "General / Other".

Second, restructure the note text into clean, readable Markdown format with headings, bullet points, and key details clearly organized.

Third, write a concise, professional title for the note.

Return your response strictly as a JSON object with this exact structure:
{{
  "category": "One of the category strings above",
  "structured_content": {{
    "title": "Concise note title",
    "markdown": "Restructured note content using Markdown formatting"
  }}
}}

Return ONLY the raw JSON. Do not wrap the JSON in markdown code blocks like ```json ... ```. Do not add any conversational text.
"""

def run_experiment():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("=" * 60)
        print("ERROR: GEMINI_API_KEY not found in environment.")
        print("Please create a .env file in the backend directory and set:")
        print("GEMINI_API_KEY=your_real_gemini_key")
        print("=" * 60)
        return

    print("Configuring Gemini API...")
    genai.configure(api_key=api_key)

    # Use the standard flash model
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config={
            "response_mime_type": "application/json"
        }
    )

    print("\nStarting Prompt Experiments...\n")

    for name, raw_text in TEST_NOTES.items():
        print(f"--- Running test for: {name} ---")
        print(f"Raw Input:\n{raw_text}\n")
        
        prompt = f"{get_system_prompt()}\n\nRaw Note Text to process:\n{raw_text}"
        
        try:
            response = model.generate_content(prompt)
            print("AI Response Output (JSON):")
            # Parse to print cleanly
            parsed = json.loads(response.text.strip())
            print(json.dumps(parsed, indent=2))
        except Exception as e:
            print(f"An error occurred: {e}")
            print(f"Raw response text was: {getattr(response, 'text', 'No response text')}")
        print("\n" + "=" * 50 + "\n")

if __name__ == "__main__":
    run_experiment()

import os
import json
# pyrefly: ignore [missing-import]
from openai import OpenAI
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

# Six sample notes to test
TEST_NOTES = {
    "Shopping List": "need to get: apples, 2% milk, bread, laundry detergent, eggs, chicken breast, garbage bags, toilet paper, bananas",
    "Meeting Notes": "Attendees: Alice, Bob, Charlie. We discussed the new API design. Bob said he will finish the user endpoints by Friday. Charlie will write tests. Alice will manage deployment next Monday.",
    "Lecture Notes": "Introduction to React: React is a JS library for UI. It uses a virtual DOM to optimize rendering. Component-based architecture means reusable UI blocks. State vs Props: state is internal/mutable, props are external/immutable.",
    "Daily Plan": "Today's tasks: 9am meet alice, 10am write code, afternoon review PRs, evening gym session, 11pm sleep",
    "Travel List": "packing for paris: passport, visa, warm jacket, sneakers, phone charger, power adapter, toothbrush, guide book",
    "General / Other": "Thinking about buying a new bike. Should research gravel vs road bikes. Budgets around 1000-1500 USD. Check local shops or online retailers like Canyon."
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

def run_experiment():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("=" * 60)
        print("ERROR: OPENAI_API_KEY not found in environment.")
        print("Please create a .env file in the backend directory and set:")
        print("OPENAI_API_KEY=your_real_openai_key")
        print("=" * 60)
        return

    print("Configuring OpenAI Client...")
    client = OpenAI(api_key=api_key)

    print("\nStarting Prompt Experiments (GPT-4o Mini)...\n")

    for name, raw_text in TEST_NOTES.items():
        print(f"--- Running test for: {name} ---")
        print(f"Raw Input:\n{raw_text}\n")
        
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": raw_text}
                ],
                temperature=0.0,
                response_format={"type": "json_object"}
            )
            
            output_text = response.choices[0].message.content.strip()
            print("AI Response Output (JSON):")
            # Parse to print cleanly
            parsed = json.loads(output_text)
            print(json.dumps(parsed, indent=2))
        except Exception as e:
            print(f"An error occurred: {e}")
        print("\n" + "=" * 50 + "\n")

if __name__ == "__main__":
    load_dotenv(dotenv_path=".env")
    run_experiment()

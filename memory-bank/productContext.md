# Product Context

## Why this project exists
People take notes the way their thoughts arrive — messy, unstructured, multiple topics tangled together. Reading those notes back later is often harder than not having taken them at all, and organizing them properly takes time most people don't make. At the same time, notes are highly personal; sometimes users want structured, automated organization, and other times they want to preserve their own thoughts and structure exactly as they formatted them.

This product bridges the gap as a versatile, AI-assisted note-taking app. It removes the friction of formatting by offering dual modes: users can write freely and let AI restructure their notes into structured categories, or they can take complete manual control over their notes with built-in markdown styling (bold, italic, underline, heading) to keep their records exactly "as-is".

## Problems it solves
* Raw, unstructured notes that are unreadable after the fact.
* The "I'll organize this later" task that never actually happens.
* Mixed-context note-taking (e.g. a grocery list with errands and reminders tangled together) that is hard to act on.
* Loss of personal note formatting when forced into automated structures.
* The signup wall that prevents quick, immediate note-taking.

## How it should work
The user lands on the app and starts writing immediately using a lightweight rich-text manual formatting toolbar — no setup or account required to try it. 
* **Anonymous Mode:** Operates as a local scratchpad. Notes preserve manual formatting (saved locally) and are gone when the tab closes. No AI features are available.
* **Authenticated Mode:** Unlocks persistent storage and the dual saving paths:
  * **Save with AI:** Runs note content through the AI categorization service, classifying it into a fixed set of structured templates (Shopping List, Meeting Notes, Lecture Notes, Daily Plan, Travel List, or General/Other) and restructuring it into a clean, readable format.
  * **Save as-is:** Saves the note directly with the user's manual formatting preserved under the "Plain Text" category, skipping AI processing entirely.
* **30-Day Free Trial:** Simulated trial based on account creation date. Authenticated users enjoy full AI features for 30 days. After 30 days, AI processing is bypassed, and notes are saved as-is in plain text. No real payment or billing systems are implemented.

## User Experience Goals
* **Frictionless first impression:** No signup wall before trying the core writing and formatting experience.
* **Calm & uncluttered:** The UI should never feel busy — the product's purpose is to reduce mental clutter, so the interface models that calm simplicity.
* **Dual-save empowerment:** Providing clear, intuitive controls ("Save with AI" vs. "Save as-is") so users feel in control of how their notes are organized and stored.
* **Calm trial visibility:** Informing users of trial limitations in a non-disruptive, subtle manner (such as warning banners and badges).
* **Fast feedback:** Processing states should feel close to instant; loading states should feel active and smooth.
* **Minimal cognitive load:** Clear typography hierarchy, consistent spacing, and zero decorative complexity.
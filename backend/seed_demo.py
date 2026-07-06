import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    sys.exit(1)

# Initialize Supabase Admin Client using service role key
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

DEMO_USERS = [
    {
        "email": "demo@notes.com",
        "password": "Demo1234!",
        "notes": [
            {
                "raw_text": "Need to buy milk, cereal, laundry detergent, and sandwich bread. Also chicken breast and fresh apples and bananas.",
                "category": "Shopping List",
                "structured_content": {
                    "title": "Weekly Groceries",
                    "markdown": "### Produce\n- [ ] Apples\n- [ ] Bananas\n\n### Dairy & Bread\n- [ ] Milk\n- [ ] Cereal\n- [ ] Sandwich bread\n\n### Meat\n- [ ] Chicken breast\n\n### Household\n- [ ] Laundry detergent"
                }
            },
            {
                "raw_text": "Attendees: Sarah, David. Discussed marketing roadmap. Sarah will finalize social posts by Wednesday. David will prepare budget sheet.",
                "category": "Meeting Notes",
                "structured_content": {
                    "title": "Marketing Sync Notes",
                    "markdown": "## Attendees\n- Sarah\n- David\n\n## Topics Discussed\n- Marketing roadmap details and priorities.\n\n## Action Items\n- [ ] Finalize social posts (Owner: Sarah, Deadline: Wednesday)\n- [ ] Prepare budget sheet (Owner: David)"
                }
            },
            {
                "raw_text": "Database Indexing Lecture: B-Trees are used for index structures. Clustered index defines physical order of data, non-clustered does not. Indexing speeds up selects but slows writes.",
                "category": "Lecture Notes",
                "structured_content": {
                    "title": "Database Indexing",
                    "markdown": "## Topic Heading\n**Database Indexing**\n\n## Key Concepts\n- **B-Trees**: Standard tree structure used for fast index lookups.\n- **Clustered Index**: Restructures table rows physically according to index key.\n- **Non-Clustered Index**: Separate index structure holding pointers to rows.\n\n## Summary Points\n- Indexes optimize read speeds at the expense of additional write overhead."
                }
            },
            {
                "raw_text": "Today's plan: 9 AM daily standup, 10 AM review documentation, 2 PM coding session, 5 PM check email, 6 PM walk in the park.",
                "category": "Daily Plan",
                "structured_content": {
                    "title": "Daily Tasks",
                    "markdown": "### Schedule for Today\n- **09:00 AM** - Daily standup\n- **10:00 AM** - Review documentation\n- **02:00 PM** - Coding session\n- **05:00 PM** - Check email\n- **06:00 PM** - Walk in the park"
                }
            },
            {
                "raw_text": "packing list for Berlin: passport, visa documents, warm coat, boots, chargers, toothbrush, euro cash",
                "category": "Travel List",
                "structured_content": {
                    "title": "Berlin Packing List",
                    "markdown": "## Packing Items\n\n### Documents\n- Passport\n- Visa documents\n\n### Clothing\n- Warm coat\n- Boots\n\n### Electronics\n- Chargers\n\n### Toiletries\n- Toothbrush\n\n### Cash\n- Euro cash"
                }
            },
            {
                "raw_text": "Brainstorming gift ideas for anniversary. Maybe a weekend spa retreat, a framed photo album, or custom jewelry. Should decide by end of next week.",
                "category": "General / Other",
                "structured_content": {
                    "title": "Anniversary Gift Ideas",
                    "markdown": "## Brainstorming Ideas\n- **Spa Retreat**: A relaxing weekend get-away.\n- **Photo Album**: Framed compilation of memories.\n- **Custom Jewelry**: Personalized necklaces or rings.\n\n## Next Steps\n- Make the final decision by the end of next week."
                }
            }
        ]
    },
    {
        "email": "test@notes.com",
        "password": "Test1234!",
        "notes": [
            {
                "raw_text": "Need to order: paper towels, AAA batteries, trash bags, dish soap, instant coffee, and protein bars from Amazon.",
                "category": "Shopping List",
                "structured_content": {
                    "title": "Amazon Order List",
                    "markdown": "### Household Supplies\n- [ ] Paper towels\n- [ ] AAA batteries\n- [ ] Trash bags\n- [ ] Dish soap\n\n### Food & Pantry\n- [ ] Instant coffee\n- [ ] Protein bars"
                }
            },
            {
                "raw_text": "Attendees: Michael, Emma. Discussed Q3 release schedule. Emma to wrap up frontend components by Friday. Michael will deploy staging server on Monday.",
                "category": "Meeting Notes",
                "structured_content": {
                    "title": "Q3 Launch Planning",
                    "markdown": "## Attendees\n- Michael\n- Emma\n\n## Topics Discussed\n- Q3 software release timeline and dependencies.\n\n## Action Items\n- [ ] Wrap up frontend components (Owner: Emma, Deadline: Friday)\n- [ ] Deploy staging server (Owner: Michael, Deadline: Monday)"
                }
            },
            {
                "raw_text": "REST API Architecture Lecture: REST is client-server, stateless, cacheable, layered system. Uses standard HTTP methods: GET, POST, PUT, DELETE. Resource-based URI design.",
                "category": "Lecture Notes",
                "structured_content": {
                    "title": "REST API Architecture",
                    "markdown": "## Topic Heading\n**REST API Architecture**\n\n## Key Concepts\n- **Statelessness**: Each request from client must contain all information needed to process it.\n- **HTTP Methods**: Proper utilization of GET (retrieve), POST (create), PUT (update), DELETE (remove).\n- **Resource-based URIs**: URIs should represent nouns/resources, not actions (e.g., `/api/notes`, not `/api/getNotes`).\n\n## Summary Points\n- REST architecture standardizes communication protocols to ensure scalable, decoupleable systems."
                }
            },
            {
                "raw_text": "Daily goals: 8 AM morning run, 9:30 AM client pitch meeting, 1 PM finish landing page mockup, 4 PM code review, 8 PM dinner with team.",
                "category": "Daily Plan",
                "structured_content": {
                    "title": "Daily Schedule",
                    "markdown": "### Schedule for Today\n- **08:00 AM** - Morning run\n- **09:30 AM** - Client pitch meeting\n- **01:00 PM** - Finish landing page mockup\n- **04:00 PM** - Code review\n- **08:00 PM** - Dinner with team"
                }
            },
            {
                "raw_text": "Travel packing check: passports, flight tickets, swimsuits, sunglasses, sandals, sunblock, beach towel, travel guide",
                "category": "Travel List",
                "structured_content": {
                    "title": "Beach Vacation Packing",
                    "markdown": "## Packing Items\n\n### Documents\n- Passports\n- Flight tickets\n\n### Clothing\n- Swimsuits\n- Sunglasses\n- Sandals\n\n### Toiletries\n- Sunblock\n\n### Miscellaneous\n- Beach towel\n- Travel guide"
                }
            },
            {
                "raw_text": "Exploring hobby ideas for winter. Thinking about oil painting, starting a small indoor herb garden, or learning chess. Should buy supplies by November.",
                "category": "General / Other",
                "structured_content": {
                    "title": "Winter Hobby Ideas",
                    "markdown": "## Brainstorming Ideas\n- **Oil Painting**: Requires canvas, brushes, oil paints, and mineral spirits.\n- **Indoor Herb Garden**: Needs pots, soil, grow lights, and seeds (basil, thyme, mint).\n- **Learning Chess**: Can start with online tutorials and a physical board.\n\n## Next Steps\n- Order painting and gardening supplies before November."
                }
            }
        ]
    }
]

def seed_data():
    print("Starting Supabase Demo Seeding Process...")
    
    # 1. Fetch existing users to avoid registration failures
    try:
        users_list = supabase_admin.auth.admin.list_users()
        existing_emails = {u.email for u in users_list}
    except Exception as e:
        print(f"Error listing users (check service role key permissions): {e}")
        return

    for user_info in DEMO_USERS:
        email = user_info["email"]
        password = user_info["password"]
        
        user_id = None
        
        if email in existing_emails:
            print(f"User {email} already exists. Skipping account creation...")
            # Retrieve the user ID
            user = next((u for u in users_list if u.email == email), None)
            if user:
                user_id = user.id
        else:
            print(f"Creating verified user account for {email}...")
            try:
                create_resp = supabase_admin.auth.admin.create_user({
                    "email": email,
                    "password": password,
                    "email_confirm": True
                })
                if create_resp and create_resp.user:
                    user_id = create_resp.user.id
                    print(f"User account created successfully with ID: {user_id}")
            except Exception as e:
                print(f"Failed to create user {email}: {e}")
                continue

        if not user_id:
            print(f"Warning: Could not retrieve or create user ID for {email}")
            continue

        # 2. Check and seed notes for this user
        try:
            # Query existing notes to avoid duplication
            existing_notes_resp = supabase_admin.table("notes").select("id").eq("user_id", user_id).execute()
            if existing_notes_resp.data:
                print(f"Notes already exist for {email}. Skipping notes insertion...")
                continue
            
            print(f"Inserting pre-loaded notes for {email}...")
            payloads = []
            for note in user_info["notes"]:
                payloads.append({
                    "user_id": user_id,
                    "raw_text": note["raw_text"],
                    "category": note["category"],
                    "structured_content": note["structured_content"]
                })
            
            res = supabase_admin.table("notes").insert(payloads).execute()
            if res.data:
                print(f"Successfully inserted {len(res.data)} notes for {email}.")
        except Exception as e:
            print(f"Failed to seed notes for {email}: {e}")

    print("\nSupabase Demo Seeding Process Complete!")

if __name__ == "__main__":
    seed_data()

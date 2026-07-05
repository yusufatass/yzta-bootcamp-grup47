from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client
supabase_client: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ANON_KEY
)

def get_user_client(token: str) -> Client:
    """Create a request-scoped Supabase client authenticated with the user's JWT."""
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY
    )
    client.postgrest.auth(token)
    return client

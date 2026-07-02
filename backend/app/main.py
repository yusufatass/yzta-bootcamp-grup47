from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Unstructured Notes Organizer API",
    description="Backend service for organizing unstructured notes using AI",
    version="0.1.0",
)

# Configure CORS so frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0",
        "message": "Unstructured Notes Organizer Backend is running",
    }


@app.get("/")
async def root():
    return {
        "message": "Welcome to the Unstructured Notes Organizer API. Access /docs for swagger UI."
    }

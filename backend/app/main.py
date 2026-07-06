from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.routers.auth import router as auth_router
from app.routers.notes import router as notes_router

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

# Custom exception handlers for consistent {"error": "message"} responses
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    errors = exc.errors()
    if errors:
        msg = f"{errors[0]['msg']} at {'.'.join(str(x) for x in errors[0]['loc'])}"
    else:
        msg = "Validation error"
    return JSONResponse(
        status_code=422,
        content={"error": f"Validation failed: {msg}"}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": f"Internal server error: {str(exc)}"}
    )

# Include Routers
app.include_router(auth_router)
app.include_router(notes_router)


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

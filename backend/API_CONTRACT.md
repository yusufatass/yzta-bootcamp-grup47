# API Contract

This document outlines the API endpoints, request/response models, and authentication protocols for the Unstructured Notes Organizer.

## Base URL
- Local Development: `http://localhost:8000`

---

## 1. Health Check

Checks the status of the backend API.

- **Endpoint**: `/health`
- **Method**: `GET`
- **Auth Required**: No
- **Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "version": "0.1.0",
    "message": "Unstructured Notes Organizer Backend is running"
  }
  ```

---

## 2. Submit Note (Authenticated)

Submit a messy, raw note to be processed by AI, categorized, structured, and saved.

- **Endpoint**: `/api/notes`
- **Method**: `POST`
- **Auth Required**: Yes. Requires Supabase JWT in the `Authorization` header.
- **Headers**:
  ```http
  Authorization: Bearer <Supabase_JWT_Token>
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "raw_text": "buy tomatoes and milk tomorrow. also call mom at 5pm. prep slides for meeting with team at 10am"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "e29202a0-4ff6-42bb-9be1-08144b6bc6b9",
    "user_id": "8a83d3e2-c07a-428e-b5cc-48f8045a2789",
    "raw_text": "buy tomatoes and milk tomorrow. also call mom at 5pm. prep slides for meeting with team at 10am",
    "category": "Daily Plan", 
    "structured_content": {
      "title": "Daily Plan & Tasks",
      "markdown": "### Shopping List\n- Tomatoes\n- Milk\n\n### Tasks\n- Call mom at 5 PM\n- Prepare slides for team meeting\n\n### Meetings\n- Team Meeting (10 AM)"
    },
    "created_at": "2026-06-30T21:18:18.123Z"
  }
  ```
- **Error Responses**:
  - **401 Unauthorized**: Missing or invalid Supabase JWT.
    ```json
    {
      "detail": "Could not validate credentials"
    }
    ```
  - **400 Bad Request**: Empty raw text or invalid format.
    ```json
    {
      "detail": "Note text cannot be empty"
    }
    ```

---

## 3. Retrieve Notes History (Authenticated)

Fetch past saved and categorized notes for the authenticated user.

- **Endpoint**: `/api/notes`
- **Method**: `GET`
- **Auth Required**: Yes. Requires Supabase JWT in the `Authorization` header.
- **Headers**:
  ```http
  Authorization: Bearer <Supabase_JWT_Token>
  ```
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "e29202a0-4ff6-42bb-9be1-08144b6bc6b9",
      "user_id": "8a83d3e2-c07a-428e-b5cc-48f8045a2789",
      "raw_text": "buy tomatoes and milk tomorrow. also call mom at 5pm. prep slides for meeting with team at 10am",
      "category": "Daily Plan",
      "structured_content": {
        "title": "Daily Plan & Tasks",
        "markdown": "### Shopping List\n- Tomatoes\n- Milk\n\n### Tasks\n- Call mom at 5 PM\n- Prepare slides for team meeting\n\n### Meetings\n- Team Meeting (10 AM)"
      },
      "created_at": "2026-06-30T21:18:18.123Z"
    }
  ]
  ```

---

## 4. Delete Note (Authenticated)

Delete a note from history.

- **Endpoint**: `/api/notes/{note_id}`
- **Method**: `DELETE`
- **Auth Required**: Yes. Requires Supabase JWT in the `Authorization` header.
- **Headers**:
  ```http
  Authorization: Bearer <Supabase_JWT_Token>
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Note deleted successfully"
  }
  ```
- **Error Responses**:
  - **404 Not Found**: Note does not exist or does not belong to the user.

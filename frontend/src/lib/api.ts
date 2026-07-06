const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}

export interface UserMe {
  id: string;
  email: string;
  email_confirmed: boolean;
}

export async function registerUser(email: string, password: string) {
  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.detail || "Registration failed");
  }
  return data;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  email_confirmed: boolean;
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.detail || "Login failed");
  }
  return data;
}

export async function getCurrentUser(): Promise<UserMe> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No auth token found");
  }

  const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }
    throw new Error(data.error || data.detail || "Failed to retrieve user info");
  }
  return data;
}

export interface MigrateNoteItem {
  raw_text: string;
  created_at: string;
}

export async function migrateNotes(notes: MigrateNoteItem[]): Promise<any> {
  const token = getAuthToken();
  if (!token) throw new Error("No auth token found for migration");

  const response = await fetch(`${BACKEND_URL}/api/notes/migrate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.detail || "Migration failed");
  }
  return data;
}

export async function createNote(raw_text: string): Promise<any> {
  const token = getAuthToken();
  if (!token) throw new Error("No auth token found");

  const response = await fetch(`${BACKEND_URL}/api/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ raw_text }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.detail || "Failed to create note");
  }
  return data;
}

export async function listNotes(): Promise<any[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No auth token found");

  const response = await fetch(`${BACKEND_URL}/api/notes`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.detail || "Failed to retrieve notes");
  }
  return data;
}

export async function deleteNote(noteId: string): Promise<any> {
  const token = getAuthToken();
  if (!token) throw new Error("No auth token found");

  const response = await fetch(`${BACKEND_URL}/api/notes/${noteId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.detail || "Failed to delete note");
  }
  return data;
}


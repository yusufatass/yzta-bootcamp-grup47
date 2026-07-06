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
  first_name?: string;
  last_name?: string;
  trial_ended: boolean;
  trial_days_left: number;
}

export async function registerUser(email: string, password: string, first_name: string, last_name: string) {
  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, first_name, last_name }),
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

export async function createNote(raw_text: string, skip_ai: boolean = false): Promise<any> {
  const token = getAuthToken();
  if (!token) throw new Error("No auth token found");

  const response = await fetch(`${BACKEND_URL}/api/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ raw_text, skip_ai }),
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

export async function updateNote(
  noteId: string, 
  raw_text: string, 
  skip_ai: boolean = false,
  category?: string,
  structured_content?: any
): Promise<any> {
  const token = getAuthToken();
  if (!token) throw new Error("No auth token found");

  const response = await fetch(`${BACKEND_URL}/api/notes/${noteId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ raw_text, skip_ai, category, structured_content }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.detail || "Failed to update note");
  }
  return data;
}

export async function forgotPassword(email: string): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.detail || "Failed to request password reset");
  }
  return data;
}

export async function resetPassword(token: string, password: string): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.detail || "Failed to reset password");
  }
  return data;
}


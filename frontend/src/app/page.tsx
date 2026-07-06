"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  getCurrentUser, 
  getAuthToken, 
  setAuthToken, 
  clearAuthToken, 
  UserMe,
  migrateNotes,
  createNote,
  listNotes,
  deleteNote
} from "@/lib/api";

interface Note {
  id: string;
  raw_text: string;
  created_at: string;
  category: string;
  title?: string;
  structured_content?: {
    title: string;
    markdown: string;
  };
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Set mounted to true on client to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // 1. Check if we just redirected with a hash token from Supabase Email confirmation
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      if (accessToken) {
        setAuthToken(accessToken);
        // Clear hash from URL
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    // 2. Fetch current authenticated user and load/migrate notes
    const checkUserAndLoadNotes = async () => {
      const token = getAuthToken();
      if (!token) {
        // Unauthenticated flow: Load notes from sessionStorage
        const storedNotes = sessionStorage.getItem("anonymous_notes");
        if (storedNotes) {
          try {
            setNotes(JSON.parse(storedNotes));
          } catch (e) {
            // Ignore parse errors
          }
        }
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (!currentUser.email_confirmed) {
          router.push("/verify");
          return;
        }
        
        setUser(currentUser);

        // Perform migration if there are anonymous notes in sessionStorage
        const storedNotes = sessionStorage.getItem("anonymous_notes");
        if (storedNotes) {
          try {
            const notesToMigrate = JSON.parse(storedNotes);
            if (Array.isArray(notesToMigrate) && notesToMigrate.length > 0) {
              await migrateNotes(
                notesToMigrate.map((n: any) => ({
                  raw_text: n.raw_text,
                  created_at: n.created_at
                }))
              );
            }
          } catch (migrationErr) {
            console.error("Failed to migrate anonymous notes:", migrationErr);
          } finally {
            // Always clear sessionStorage after migration attempt to avoid repeat attempts
            sessionStorage.removeItem("anonymous_notes");
          }
        }

        // Fetch notes from the database
        const dbNotes = await listNotes();
        setNotes(dbNotes.map((n: any) => ({
          id: n.id,
          raw_text: n.raw_text,
          created_at: n.created_at,
          category: n.category,
          title: n.structured_content?.title || n.raw_text.split("\n")[0].substring(0, 30),
          structured_content: n.structured_content
        })));
      } catch (err) {
        // Token was invalid or expired
        clearAuthToken();
        // Fall back to sessionStorage notes
        const storedNotes = sessionStorage.getItem("anonymous_notes");
        if (storedNotes) {
          try {
            setNotes(JSON.parse(storedNotes));
          } catch (e) {}
        }
      } finally {
        setLoading(false);
      }
    };

    checkUserAndLoadNotes();
  }, [mounted, router]);

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
    setSelectedNote(null);
    setNotes([]);
    setError(null);
    // Reload local notes
    const storedNotes = sessionStorage.getItem("anonymous_notes");
    if (storedNotes) {
      try {
        setNotes(JSON.parse(storedNotes));
      } catch (e) {}
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = noteText.trim();
    if (!trimmed) return;

    if (trimmed.length < 10) {
      setError("Note must be at least 10 characters long.");
      return;
    }

    if (user) {
      setIsOrganizing(true);
      try {
        const savedNote = await createNote(noteText);
        const mappedNote: Note = {
          id: savedNote.id,
          raw_text: savedNote.raw_text,
          created_at: savedNote.created_at,
          category: savedNote.category,
          title: savedNote.structured_content?.title || savedNote.raw_text.split("\n")[0].substring(0, 30),
          structured_content: savedNote.structured_content
        };
        setNotes((prevNotes) => [mappedNote, ...prevNotes]);
        setNoteText("");
        // Automatically select the saved structured note to show organized content
        setSelectedNote(mappedNote);
      } catch (err: any) {
        setError(err.message || "Failed to save note to backend");
      } finally {
        setIsOrganizing(false);
      }
    } else {
      // Anonymous saving
      const id = typeof crypto !== "undefined" && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 9);

      const newNote: Note = {
        id,
        raw_text: noteText,
        created_at: new Date().toISOString(),
        category: "Plain Text",
        title: noteText.split("\n")[0].substring(0, 30) + (noteText.length > 30 ? "..." : "")
      };

      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      sessionStorage.setItem("anonymous_notes", JSON.stringify(updatedNotes));
      setNoteText("");
      // Select it to view raw text
      setSelectedNote(newNote);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
    }

    if (user) {
      try {
        await deleteNote(noteId);
        setNotes(notes.filter(n => n.id !== noteId));
      } catch (err: any) {
        setError(err.message || "Failed to delete note");
      }
    } else {
      const updatedNotes = notes.filter(n => n.id !== noteId);
      setNotes(updatedNotes);
      sessionStorage.setItem("anonymous_notes", JSON.stringify(updatedNotes));
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Shopping List":
        return "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-500/10";
      case "Meeting Notes":
        return "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-500/10";
      case "Lecture Notes":
        return "bg-purple-50 text-purple-700 ring-purple-600/10 dark:bg-purple-950/20 dark:text-purple-400 dark:ring-purple-500/10";
      case "Daily Plan":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-500/10";
      case "Travel List":
        return "bg-sky-50 text-sky-700 ring-sky-600/10 dark:bg-sky-950/20 dark:text-sky-400 dark:ring-sky-500/10";
      case "Pending AI processing":
        return "bg-zinc-100 text-zinc-600 ring-zinc-500/10 dark:bg-zinc-800 dark:text-zinc-400 animate-pulse";
      default:
        return "bg-zinc-100 text-zinc-650 ring-zinc-550/10 dark:bg-zinc-800/50 dark:text-zinc-400";
    }
  };

  const parseInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let i = 0;
    while (i < text.length) {
      const nextBold = text.indexOf("**", i);
      const nextItalic = text.indexOf("*", i);

      let isBold = false;
      let index = -1;

      if (nextBold !== -1 && (nextItalic === -1 || nextBold <= nextItalic)) {
        isBold = true;
        index = nextBold;
      } else if (nextItalic !== -1) {
        isBold = false;
        index = nextItalic;
      }

      if (index === -1) {
        parts.push(text.substring(i));
        break;
      }

      if (index > i) {
        parts.push(text.substring(i, index));
      }

      const tag = isBold ? "**" : "*";
      const closingIndex = text.indexOf(tag, index + tag.length);

      if (closingIndex === -1) {
        parts.push(tag);
        i = index + tag.length;
      } else {
        const content = text.substring(index + tag.length, closingIndex);
        if (isBold) {
          parts.push(
            <strong key={index} className="font-bold text-zinc-950 dark:text-white">
              {parseInline(content)}
            </strong>
          );
        } else {
          parts.push(
            <em key={index} className="italic text-zinc-800 dark:text-zinc-200">
              {parseInline(content)}
            </em>
          );
        }
        i = closingIndex + tag.length;
      }
    }
    return parts;
  };

  const parseMarkdown = (md: string) => {
    return md.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-2">
            {parseInline(line.substring(4))}
          </h3>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-base font-bold text-zinc-900 dark:text-zinc-50 mt-5 mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-1">
            {parseInline(line.substring(3))}
          </h2>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-6 mb-3">
            {parseInline(line.substring(2))}
          </h1>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-zinc-750 dark:text-zinc-350 my-1 leading-relaxed">
            {parseInline(line.substring(2))}
          </li>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-2"></div>;
      }
      return (
        <p key={idx} className="text-sm text-zinc-750 dark:text-zinc-355 my-1 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    });
  };

  // If not mounted yet, render a skeleton to match server-side HTML and avoid hydration issues
  if (!mounted) {
    return (
      <div className="h-screen max-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans flex flex-col overflow-hidden">
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span className="text-xl font-bold text-zinc-900 dark:text-white">Unstructured Notes</span>
            <div className="w-24 h-8 bg-zinc-200 dark:bg-zinc-850 rounded animate-pulse"></div>
          </div>
        </header>
        <div className="flex max-w-7xl mx-auto p-6 gap-6">
          <div className="w-1/3 h-64 bg-zinc-200 dark:bg-zinc-850 rounded animate-pulse"></div>
          <div className="w-2/3 h-64 bg-zinc-200 dark:bg-zinc-850 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans flex flex-col overflow-hidden">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <span>📝</span>
            <span>Unstructured Notes</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-24 h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  AI Unlocked
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400 hidden sm:inline">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-6 gap-6 overflow-hidden min-h-0">
        {/* Left Sidebar: Note History */}
        <section className="w-full md:w-80 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 overflow-y-auto max-h-[300px] md:max-h-none">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 flex items-center justify-between w-full">
              <span>Note History</span>
              <span className="text-xs font-normal text-zinc-500">{notes.length} notes</span>
            </h2>
            {selectedNote && (
              <button
                onClick={() => {
                  setSelectedNote(null);
                  setError(null);
                }}
                className="ml-2 text-xs text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 bg-zinc-50 dark:bg-zinc-950 transition-colors"
              >
                <span>+</span> New Note
              </button>
            )}
          </div>
          {notes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/30 dark:bg-zinc-950/10 my-2">
              <span className="text-3xl mb-3 animate-pulse">✍️</span>
              <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Your space is empty</h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 max-w-[180px] mx-auto leading-relaxed">
                Type your thoughts freely. Our AI will group, clean, and structure them for you.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNote(note);
                    setError(null);
                  }}
                  className={`group relative p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer hover:shadow-sm active:scale-[0.98] ${
                    selectedNote?.id === note.id
                      ? "border-zinc-800 bg-zinc-50/90 dark:border-zinc-300 dark:bg-zinc-950 ring-1 ring-zinc-850 dark:ring-zinc-350 shadow-sm"
                      : "border-zinc-200/60 bg-zinc-50/40 hover:bg-zinc-50/80 hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:hover:bg-zinc-955/60 dark:hover:border-zinc-700"
                  }`}
                >
                  {selectedNote?.id === note.id && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-zinc-900 dark:bg-zinc-100 rounded-r-lg" />
                  )}
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate pr-6">
                    {note.title || "Untitled Note"}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-1.5 pr-6 leading-normal">
                    {note.raw_text}
                  </p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
                    <span className="text-[9px] text-zinc-400">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ring-1 ring-inset ${getCategoryColor(note.category)}`}>
                      {note.category}
                    </span>
                  </div>
                  
                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-850"
                    title="Delete note"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Center Workspace */}
        {selectedNote ? (
          <section className="flex-1 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden min-h-0">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedNote(null);
                    setError(null);
                  }}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                  title="Back to Note Input"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    {selectedNote.structured_content?.title || selectedNote.title || "Untitled Note"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${getCategoryColor(selectedNote.category)}`}>
                      {selectedNote.category}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(selectedNote.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDeleteNote(selectedNote.id)}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Delete Note
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scroll-smooth min-h-0">
              {selectedNote.structured_content?.markdown ? (
                <div className="prose dark:prose-invert max-w-none text-left">
                  {parseMarkdown(selectedNote.structured_content.markdown)}
                </div>
              ) : (
                <div className="text-left whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850">
                  {selectedNote.raw_text}
                </div>
              )}

              {selectedNote.structured_content?.markdown && (
                <details className="mt-8 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <summary className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer font-semibold outline-none select-none">
                    Show Raw Unstructured Text
                  </summary>
                  <div className="mt-3 text-left whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 font-mono">
                    {selectedNote.raw_text}
                  </div>
                </details>
              )}
            </div>
          </section>
        ) : (
          <section className="flex-1 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden min-h-0">
            {isOrganizing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/85 flex flex-col items-center justify-center rounded-2xl backdrop-blur-[2px] z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white mb-4"></div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white animate-pulse">Organizing your note...</p>
              </div>
            )}
            <form onSubmit={handleSaveNote} className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
              <div className="flex-1 flex flex-col min-h-0">
                <label
                  htmlFor="raw_text"
                  className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2"
                >
                  Write your thoughts freely...
                </label>
                <textarea
                  id="raw_text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type your notes here exactly as you think them. Write down shopping lists, todo tasks, and meeting summaries mixed up together. No formatting required..."
                  className="flex-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/30 p-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 dark:focus:bg-zinc-950 resize-none min-h-0"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium text-left">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-left">
                  {user ? (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                      <span>✨</span>
                      <span>AI formatting is active. Notes will be structured and saved permanently.</span>
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 flex-wrap">
                      <span>🔒</span>
                      <span>Anonymous Mode: notes saved to this tab only.</span>
                      <Link href="/login" className="font-semibold underline hover:text-zinc-900 dark:hover:text-zinc-50">
                        Sign in
                      </Link>
                      <span>to unlock AI features.</span>
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className="w-full sm:w-auto bg-zinc-900 text-white rounded-lg px-6 py-2 text-sm font-semibold shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-650 transition-colors"
                >
                  Save Note
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

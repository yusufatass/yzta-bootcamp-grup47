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
  deleteNote,
  updateNote
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
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
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

  const applyFormat = (type: 'bold' | 'italic' | 'underline' | 'heading' | 'bullet' | 'checklist', isEdit: boolean = false) => {
    const textareaId = isEdit ? "edit_raw_text" : "raw_text";
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    let newText = "";
    let newStart = start;
    let newEnd = end;

    if (type === "bullet" || type === "checklist") {
      const prefixToInsert = type === "bullet" ? "- " : "- [ ] ";
      
      if (start === end) {
        // No selection: toggle current line
        let lineStart = start;
        while (lineStart > 0 && text[lineStart - 1] !== "\n") {
          lineStart--;
        }
        newText = text.substring(0, lineStart) + prefixToInsert + text.substring(lineStart);
        newStart = start + prefixToInsert.length;
        newEnd = end + prefixToInsert.length;
      } else {
        // Selection: toggle all lines in selection
        let selStart = start;
        while (selStart > 0 && text[selStart - 1] !== "\n") {
          selStart--;
        }
        let selEnd = end;
        while (selEnd < text.length && text[selEnd] !== "\n" && text[selEnd] !== "\r") {
          selEnd++;
        }
        
        const rangeText = text.substring(selStart, selEnd);
        const lines = rangeText.split("\n");
        const formattedLines = lines.map(line => prefixToInsert + line);
        const replacement = formattedLines.join("\n");
        
        newText = text.substring(0, selStart) + replacement + text.substring(selEnd);
        newStart = selStart;
        newEnd = selStart + replacement.length;
      }
    } else {
      const selectedText = text.substring(start, end);
      let prefix = "";
      let suffix = "";

      switch (type) {
        case "bold":
          prefix = "**";
          suffix = "**";
          break;
        case "italic":
          prefix = "*";
          suffix = "*";
          break;
        case "underline":
          prefix = "<u>";
          suffix = "</u>";
          break;
        case "heading":
          prefix = "\n### ";
          suffix = "";
          break;
      }

      const replacement = prefix + selectedText + suffix;
      newText = text.substring(0, start) + replacement + text.substring(end);
      newStart = start + prefix.length;
      newEnd = start + prefix.length + selectedText.length;
    }

    if (isEdit) {
      setEditText(newText);
    } else {
      setNoteText(newText);
    }

    // Set cursor selection back to the formatted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
    setSelectedNote(null);
    setNotes([]);
    setError(null);
    setIsEditing(false);
    setEditText("");
    // Reload local notes
    const storedNotes = sessionStorage.getItem("anonymous_notes");
    if (storedNotes) {
      try {
        setNotes(JSON.parse(storedNotes));
      } catch (e) {}
    }
  };

  const handleSaveNoteAction = async (skipAi: boolean) => {
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
        const savedNote = await createNote(noteText, skipAi);
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

      const titleText = noteText.split("\n")[0].substring(0, 30) + (noteText.length > 30 ? "..." : "");
      const newNote: Note = {
        id,
        raw_text: noteText,
        created_at: new Date().toISOString(),
        category: "Plain Text",
        title: titleText,
        structured_content: {
          title: titleText,
          markdown: noteText
        }
      };

      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      sessionStorage.setItem("anonymous_notes", JSON.stringify(updatedNotes));
      setNoteText("");
      setSelectedNote(null);

      // Track saved count & trigger onboarding modal
      const currentCountStr = sessionStorage.getItem("anonymous_saved_count") || "0";
      const newCount = parseInt(currentCountStr, 10) + 1;
      sessionStorage.setItem("anonymous_saved_count", newCount.toString());

      if (newCount === 1 || (newCount > 1 && newCount % 4 === 0)) {
        setShowOnboarding(true);
      }
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const skipAiDefault = user ? false : true;
    handleSaveNoteAction(skipAiDefault);
  };

  const handleToggleCheckbox = async (lineIdx: number) => {
    if (!selectedNote) return;

    const markdown = selectedNote.structured_content?.markdown || "";
    const lines = markdown.split("\n");
    if (lineIdx < 0 || lineIdx >= lines.length) return;

    const line = lines[lineIdx];
    let updatedLine = line;

    // Matches bullet (-, *), spaces, [ ], and rest of the text
    const checkboxRegex = /^(\s*[-\*]\s+\[)([ xX])(\]\s*.*)$/;
    const match = line.match(checkboxRegex);
    if (!match) return; // Not a checkbox line

    const prefix = match[1];
    const currentStatus = match[2];
    const suffix = match[3];

    const newStatus = currentStatus.toLowerCase() === "x" ? " " : "x";
    updatedLine = prefix + newStatus + suffix;
    lines[lineIdx] = updatedLine;
    const newMarkdown = lines.join("\n");

    // Also update raw_text if it matches/structured
    let newRawText = selectedNote.raw_text;
    const rawLines = newRawText.split("\n");
    const contentText = suffix.replace(/^\]\s*/, "").trim();
    
    if (contentText) {
      for (let j = 0; j < rawLines.length; j++) {
        const rawLine = rawLines[j];
        if (rawLine.includes(contentText)) {
          const rawMatch = rawLine.match(/^(\s*[-\*]\s+\[)([ xX])(\]\s*.*)$/);
          if (rawMatch) {
            const rawPrefix = rawMatch[1];
            const rawSuffix = rawMatch[3];
            rawLines[j] = rawPrefix + newStatus + rawSuffix;
            break;
          }
        }
      }
      newRawText = rawLines.join("\n");
    } else {
      newRawText = newMarkdown;
    }

    const updatedNote: Note = {
      ...selectedNote,
      raw_text: newRawText,
      structured_content: {
        title: selectedNote.structured_content?.title || selectedNote.raw_text.split("\n")[0].substring(0, 30) || "Untitled Note",
        markdown: newMarkdown
      }
    };

    setNotes((prevNotes) => prevNotes.map((n) => (n.id === selectedNote.id ? updatedNote : n)));
    setSelectedNote(updatedNote);

    if (user) {
      try {
        await updateNote(
          selectedNote.id,
          newRawText,
          true, // skip_ai
          selectedNote.category,
          updatedNote.structured_content
        );
      } catch (err: any) {
        console.error("Failed to persist checkbox toggle to backend:", err);
        setError(err.message || "Failed to save checkbox update to backend");
      }
    } else {
      const storedNotes = sessionStorage.getItem("anonymous_notes");
      if (storedNotes) {
        try {
          const parsed: Note[] = JSON.parse(storedNotes);
          const updatedList = parsed.map((n) => (n.id === selectedNote.id ? updatedNote : n));
          sessionStorage.setItem("anonymous_notes", JSON.stringify(updatedList));
        } catch (e) {
          console.error("Failed to save anonymous note checkbox toggle:", e);
        }
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
      setEditText("");
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

  const handleUpdateNoteAction = async (skipAi: boolean) => {
    setError(null);
    const trimmed = editText.trim();
    if (!trimmed) return;

    if (trimmed.length < 10) {
      setError("Note must be at least 10 characters long.");
      return;
    }

    if (user) {
      setIsUpdating(true);
      try {
        const updated = await updateNote(selectedNote!.id, trimmed, skipAi);
        const mappedNote: Note = {
          id: updated.id,
          raw_text: updated.raw_text,
          created_at: updated.created_at,
          category: updated.category,
          title: updated.structured_content?.title || updated.raw_text.split("\n")[0].substring(0, 30),
          structured_content: updated.structured_content
        };
        // Update the note in notes list
        setNotes((prevNotes) => prevNotes.map(n => n.id === mappedNote.id ? mappedNote : n));
        // Switch view back to newly organized note
        setSelectedNote(mappedNote);
        setIsEditing(false);
      } catch (err: any) {
        setError(err.message || "Failed to update note");
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Anonymous note local update (no AI)
      const mappedNote: Note = {
        ...selectedNote!,
        raw_text: trimmed,
        title: trimmed.split("\n")[0].substring(0, 30) + (trimmed.length > 30 ? "..." : ""),
        structured_content: {
          title: trimmed.split("\n")[0].substring(0, 30) + (trimmed.length > 30 ? "..." : ""),
          markdown: trimmed
        }
      };
      
      const updatedNotes = notes.map(n => n.id === mappedNote.id ? mappedNote : n);
      setNotes(updatedNotes);
      sessionStorage.setItem("anonymous_notes", JSON.stringify(updatedNotes));
      setSelectedNote(mappedNote);
      setIsEditing(false);
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const skipAiDefault = user ? false : true;
    handleUpdateNoteAction(skipAiDefault);
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
      const nextUnderline = text.indexOf("<u>", i);

      let tokenType: "bold" | "italic" | "underline" | "none" = "none";
      let index = -1;

      const candidates = [
        { type: "bold" as const, pos: nextBold, tag: "**" },
        { type: "italic" as const, pos: nextItalic, tag: "*" },
        { type: "underline" as const, pos: nextUnderline, tag: "<u>" }
      ].filter(c => c.pos !== -1);

      if (candidates.length > 0) {
        candidates.sort((a, b) => a.pos - b.pos);
        tokenType = candidates[0].type;
        index = candidates[0].pos;
      }

      if (index === -1) {
        parts.push(text.substring(i));
        break;
      }

      if (index > i) {
        parts.push(text.substring(i, index));
      }

      const openTag = tokenType === "bold" ? "**" : tokenType === "italic" ? "*" : "<u>";
      const closeTag = tokenType === "bold" ? "**" : tokenType === "italic" ? "*" : "</u>";
      const closingIndex = text.indexOf(closeTag, index + openTag.length);

      if (closingIndex === -1) {
        parts.push(openTag);
        i = index + openTag.length;
      } else {
        const content = text.substring(index + openTag.length, closingIndex);
        if (tokenType === "bold") {
          parts.push(
            <strong key={index} className="font-bold text-zinc-950 dark:text-white">
              {parseInline(content)}
            </strong>
          );
        } else if (tokenType === "italic") {
          parts.push(
            <em key={index} className="italic text-zinc-808 dark:text-zinc-200">
              {parseInline(content)}
            </em>
          );
        } else {
          parts.push(
            <span key={index} className="underline text-zinc-900 dark:text-zinc-50">
              {parseInline(content)}
            </span>
          );
        }
        i = closingIndex + closeTag.length;
      }
    }
    return parts;
  };

  const parseMarkdown = (md: string) => {
    return md.split("\n").map((line, idx) => {
      // Check if this line is a checkbox line
      const checkboxMatch = line.match(/^(\s*)[-\*]\s+\[([ xX])\]\s*(.*)$/);
      if (checkboxMatch) {
        const indent = checkboxMatch[1];
        const isChecked = checkboxMatch[2].toLowerCase() === "x";
        const contentText = checkboxMatch[3];
        
        return (
          <div 
            key={idx} 
            className="flex items-start gap-2.5 my-1.5 text-sm leading-relaxed text-left"
            style={{ paddingLeft: `${Math.max(16, indent.length * 12)}px` }}
          >
            <button
              type="button"
              onClick={() => handleToggleCheckbox(idx)}
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-500 ${
                isChecked 
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950" 
                  : "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
              }`}
              title={isChecked ? "Mark as unchecked" : "Mark as checked"}
            >
              {isChecked && (
                <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 20 20">
                  <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                </svg>
              )}
            </button>
            <span className={isChecked ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"}>
              {parseInline(contentText)}
            </span>
          </div>
        );
      }

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
                {user.trial_ended ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-455"></span>
                    Trial Ended
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    AI Active ({user.trial_days_left}d left)
                  </span>
                )}
                <span className="text-sm text-zinc-600 dark:text-zinc-400 hidden sm:inline">
                  {user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.email}
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
      {user && user.trial_ended && (
        <div className="bg-amber-50 border-b border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 px-6 py-2.5 text-center text-xs font-semibold text-amber-800 dark:text-amber-400">
          ⚠️ Your 30-day free trial has ended. AI note organization is no longer available. Notes will be saved as Plain Text.
        </div>
      )}

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
                  setIsEditing(false);
                  setEditText("");
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
                    setIsEditing(false);
                    setEditText(note.raw_text);
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
                    setIsEditing(false);
                    setEditText("");
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
              
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditText(selectedNote.raw_text);
                      setError(null);
                    }}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Delete Note
                </button>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateNote} className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
                {isUpdating && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/85 flex flex-col items-center justify-center rounded-2xl backdrop-blur-[2px] z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white mb-4"></div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white animate-pulse">
                      {user?.trial_ended ? "Saving your note..." : "Organizing your note..."}
                    </p>
                  </div>
                )}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="edit_raw_text"
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 text-left"
                    >
                      Edit note content
                    </label>
                    
                    {/* Formatting Toolbar */}
                    <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
                      <button
                        type="button"
                        onClick={() => applyFormat("bold", true)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors"
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("italic", true)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs italic font-serif transition-colors"
                        title="Italic"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("underline", true)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs underline transition-colors"
                        title="Underline"
                      >
                        U
                      </button>
                      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => applyFormat("heading", true)}
                        className="h-7 px-2 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-[10px] font-extrabold tracking-wider transition-colors"
                        title="Add Heading"
                      >
                        H1/H2
                      </button>
                      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => applyFormat("bullet", true)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                        title="Bullet List"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("checklist", true)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                        title="Checklist"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="edit_raw_text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Type your notes here..."
                    className="flex-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/30 p-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 dark:focus:bg-zinc-950 resize-none min-h-0"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium text-left">
                    ⚠️ {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(selectedNote.raw_text);
                      setError(null);
                    }}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  {user ? (
                    user.trial_ended ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateNoteAction(true)}
                        disabled={isUpdating || !editText.trim()}
                        className="bg-zinc-900 text-white rounded-lg px-6 py-2 text-sm font-semibold shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-650 transition-colors"
                      >
                        Update
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateNoteAction(true)}
                          disabled={isUpdating || !editText.trim()}
                          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                        >
                          Update as-is
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateNoteAction(false)}
                          disabled={isUpdating || !editText.trim()}
                          className="bg-zinc-900 text-white rounded-lg px-6 py-2 text-sm font-semibold shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-650 transition-colors"
                        >
                          Update with AI
                        </button>
                      </div>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateNoteAction(true)}
                      disabled={isUpdating || !editText.trim()}
                      className="bg-zinc-900 text-white rounded-lg px-6 py-2 text-sm font-semibold shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-650 transition-colors"
                    >
                      Update
                    </button>
                  )}
                </div>
              </form>
            ) : (
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
            )}
          </section>
        ) : (
          <section className="flex-1 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden min-h-0">
            {isOrganizing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/85 flex flex-col items-center justify-center rounded-2xl backdrop-blur-[2px] z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white mb-4"></div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white animate-pulse">
                  {user?.trial_ended ? "Saving your note..." : "Organizing your note..."}
                </p>
              </div>
            )}
            <form onSubmit={handleSaveNote} className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="raw_text"
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                  >
                    Write your thoughts freely...
                  </label>
                  
                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => applyFormat("bold", false)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("italic", false)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs italic font-serif transition-colors"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("underline", false)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs underline transition-colors"
                      title="Underline"
                    >
                      U
                    </button>
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => applyFormat("heading", false)}
                      className="h-7 px-2 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-[10px] font-extrabold tracking-wider transition-colors"
                      title="Add Heading"
                    >
                      H1/H2
                    </button>
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => applyFormat("bullet", false)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                      title="Bullet List"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("checklist", false)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                      title="Checklist"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
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
                    user.trial_ended ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Free trial ended. AI organization is disabled. Notes will be saved as plain text.</span>
                      </p>
                    ) : (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <span>✨</span>
                        <span>AI formatting is active. Notes will be structured and saved permanently.</span>
                      </p>
                    )
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
                {user ? (
                  user.trial_ended ? (
                    <button
                      type="button"
                      onClick={() => handleSaveNoteAction(true)}
                      disabled={!noteText.trim()}
                      className="w-full sm:w-auto bg-zinc-900 text-white rounded-lg px-6 py-2 text-sm font-semibold shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-650 transition-colors"
                    >
                      Save Note
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleSaveNoteAction(true)}
                        disabled={!noteText.trim()}
                        className="w-full sm:w-auto rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        Save as-is
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveNoteAction(false)}
                        disabled={!noteText.trim()}
                        className="w-full sm:w-auto bg-zinc-900 text-white rounded-lg px-6 py-2 text-sm font-semibold shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-650 transition-colors"
                      >
                        Save with AI
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveNoteAction(true)}
                    disabled={!noteText.trim()}
                    className="w-full sm:w-auto bg-zinc-900 text-white rounded-lg px-6 py-2 text-sm font-semibold shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-650 transition-colors"
                  >
                    Save Note
                  </button>
                )}
              </div>
            </form>
          </section>
        )}
      </main>

      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </div>
  );
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const router = useRouter();

  if (!isOpen) return null;

  const handleDismiss = () => {
    onClose();
  };

  const handleRegister = () => {
    onClose();
    router.push("/register");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 flex flex-col justify-between min-h-[440px]">
        {/* Close button at top right */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col justify-center mt-4">
          {step === 1 && (
            <div className="space-y-4">
              {/* Illustration Placeholder */}
              <div className="w-full h-40 bg-zinc-950 rounded-xl flex flex-col items-center justify-center text-zinc-400 border border-zinc-800/20">
                <span className="text-2xl mb-1">🪄</span>
                <span className="text-xs uppercase tracking-wider font-semibold">illustration</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Your notes are messy? Let AI organize them for you.
              </h3>
              <p className="text-sm text-zinc-650 dark:text-zinc-400">
                Instantly turn scattered thoughts, lecture records, or meetings into clean, categorized markdown lists.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {/* Illustration Placeholder */}
              <div className="w-full h-40 bg-zinc-950 rounded-xl flex flex-col items-center justify-center text-zinc-400 border border-zinc-800/20">
                <span className="text-2xl mb-1">🎁</span>
                <span className="text-xs uppercase tracking-wider font-semibold">illustration</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Try it free for 30 days — no card required.
              </h3>
              <p className="text-sm text-zinc-650 dark:text-zinc-400">
                Unlock full access to AI note organization for a month. Save notes and access templates with zero commitments.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* Illustration Placeholder */}
              <div className="w-full h-40 bg-zinc-950 rounded-xl flex flex-col items-center justify-center text-zinc-400 border border-zinc-800/20">
                <span className="text-2xl mb-1">🚀</span>
                <span className="text-xs uppercase tracking-wider font-semibold">illustration</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Get Started Now
              </h3>
              <p className="text-sm text-zinc-650 dark:text-zinc-400">
                Create a secure account in seconds to save your progress, edit notes, and keep AI organizing them.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 space-y-4">
          {/* Progress Indicators */}
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                  step === s 
                    ? "w-6 bg-zinc-900 dark:bg-white" 
                    : "w-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-400 dark:hover:bg-zinc-700"
                }`}
                aria-label={`Go to step ${s}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300 transition-colors"
              >
                Maybe later
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 ml-auto"
              >
                Next
              </button>
            ) : (
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300 transition-colors sm:hidden"
                >
                  Maybe later
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  updateNote,
  renameNoteTitle
} from "@/lib/api";
import { ThemeToggle } from "@/lib/theme";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/lib/i18n";

interface Note {
  id: string;
  raw_text: string;
  original_raw_text?: string;
  created_at: string;
  category: string;
  title?: string;
  title_is_custom?: boolean;
  structured_content?: {
    title: string;
    markdown: string;
  };
}

const PRESET_PROMPTS = [
  {
    id: "simplify",
    icon: "🌸",
    label: "Simplify",
    description: "Rewrites the note into simpler terms"
  },
  {
    id: "explain",
    icon: "💡",
    label: "Explain",
    description: "Explains complex jargon or concepts"
  },
  {
    id: "improve",
    icon: "📝",
    label: "Improve",
    description: "Polishes grammar, flow, and tone"
  },
  {
    id: "custom",
    icon: "💬",
    label: "Ask AI Assistant",
    description: "Submit custom instructions to the AI"
  }
];

export default function Home() {
  const tHeader = useTranslations("Header");
  const tSidebar = useTranslations("Sidebar");
  const tWorkspace = useTranslations("Workspace");
  const tToolbars = useTranslations("Toolbars");
  const tPresets = useTranslations("Presets");
  const tErrors = useTranslations("Errors");
  const tDialogs = useTranslations("Dialogs");
  const tOnboarding = useTranslations("Onboarding");

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
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  // Title rename state
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState("");
  const [isTitleSaving, setIsTitleSaving] = useState(false);
  const router = useRouter();

  // Delete confirmation & toast state
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Prompt dropdown state
  const [isPromptDropdownOpen, setIsPromptDropdownOpen] = useState(false);
  const [promptQuery, setPromptQuery] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [customPromptText, setCustomPromptText] = useState("");
  const promptDropdownRef = useRef<HTMLDivElement>(null);

  // Save prompt dropdown state
  const [isSavePromptDropdownOpen, setIsSavePromptDropdownOpen] = useState(false);
  const [savePromptQuery, setSavePromptQuery] = useState("");
  const [selectedSavePromptId, setSelectedSavePromptId] = useState<string | null>(null);
  const [customSavePromptText, setCustomSavePromptText] = useState("");
  const savePromptDropdownRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastVisible(true), 10);
    setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToastMessage(null), 300);
    }, 3000);
  };
  const getNotePreview = (note: Note) => {
    const text = note.structured_content?.markdown || note.raw_text || "";
    return text
      .replace(/^(\s*[-\*]\s+\[[ xX]\]\s*)/gm, "") // checkboxes
      .replace(/^(\s*[-\*]\s+)/gm, "")           // bullet lists
      .replace(/^(\s*#+\s*)/gm, "")              // headers
      .replace(/\*\*|__|\*|_/g, "")              // bold/italic
      .replace(/<\/?[^>]+(>|$)/g, "")            // strip HTML tags
      .replace(/\s+/g, " ")                      // collapse whitespace
      .trim();
  };



  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.trim().toLowerCase();
    const titleMatch = note.title ? note.title.toLowerCase().includes(query) : false;
    const structuredTitleMatch = note.structured_content?.title ? note.structured_content.title.toLowerCase().includes(query) : false;
    const rawTextMatch = note.raw_text ? note.raw_text.toLowerCase().includes(query) : false;
    const matchesSearch = !query || titleMatch || structuredTitleMatch || rawTextMatch;

    const matchesCategory = categoryFilter === "All" || note.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Set mounted to true on client to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle click outside for prompt dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (promptDropdownRef.current && !promptDropdownRef.current.contains(event.target as Node)) {
        setIsPromptDropdownOpen(false);
      }
    }
    if (isPromptDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPromptDropdownOpen]);

  // Handle click outside for save prompt dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (savePromptDropdownRef.current && !savePromptDropdownRef.current.contains(event.target as Node)) {
        setIsSavePromptDropdownOpen(false);
      }
    }
    if (isSavePromptDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSavePromptDropdownOpen]);

  // Escape key closes whichever prompt dropdown is open
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isPromptDropdownOpen) {
          setIsPromptDropdownOpen(false);
          setSelectedPromptId(null);
        }
        if (isSavePromptDropdownOpen) {
          setIsSavePromptDropdownOpen(false);
          setSelectedSavePromptId(null);
        }
      }
    }
    if (isPromptDropdownOpen || isSavePromptDropdownOpen) {
      document.addEventListener("keydown", handleEscKey);
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isPromptDropdownOpen, isSavePromptDropdownOpen]);

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
          original_raw_text: n.original_raw_text || n.raw_text,
          created_at: n.created_at,
          category: n.category,
          title: n.structured_content?.title || n.raw_text.split("\n")[0].substring(0, 30),
          title_is_custom: n.title_is_custom ?? false,
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
          } catch (e) { }
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

  const handleLogoutClick = () => {
    setIsSignOutModalOpen(true);
  };

  const executeLogout = () => {
    setIsSignOutModalOpen(false);
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
      } catch (e) { }
    }
  };

  const handleSaveNoteAction = async (skipAi: boolean, promptType?: string, customPrompt?: string) => {
    setError(null);
    const trimmed = noteText.trim();
    if (!trimmed) return;

    if (trimmed.length < 10) {
      setError(tErrors("minLength"));
      return;
    }

    if (user) {
      setIsOrganizing(true);
      try {
        const savedNote = await createNote(noteText, skipAi, promptType, customPrompt);
        const mappedNote: Note = {
          id: savedNote.id,
          raw_text: savedNote.raw_text,
          original_raw_text: savedNote.original_raw_text || savedNote.raw_text,
          created_at: savedNote.created_at,
          category: savedNote.category,
          title: savedNote.structured_content?.title || savedNote.raw_text.split("\n")[0].substring(0, 30),
          title_is_custom: savedNote.title_is_custom ?? false,
          structured_content: savedNote.structured_content
        };
        setNotes((prevNotes) => [mappedNote, ...prevNotes]);
        setNoteText("");
        // Automatically select the saved structured note to show organized content
        setSelectedNote(mappedNote);
      } catch (err: any) {
        setError(err.message || tErrors("saveFailed"));
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
        original_raw_text: noteText,
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
        title: selectedNote.structured_content?.title || selectedNote.raw_text.split("\n")[0].substring(0, 30) || tSidebar("untitledNote"),
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
        setError(err.message || tErrors("updateFailed"));
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

  const handleDeleteNote = (noteId: string) => {
    setNoteIdToDelete(noteId);
  };

  const executeDeleteNote = async () => {
    if (!noteIdToDelete) return;
    const targetId = noteIdToDelete;

    // Close the dialog immediately
    setNoteIdToDelete(null);

    // Set the note card ID currently being deleted to play the fade-out transition
    setDeletingNoteId(targetId);

    // Wait 300ms for sidebar fade-out transition to complete
    setTimeout(async () => {
      if (selectedNote?.id === targetId) {
        setSelectedNote(null);
        setIsEditing(false);
        setEditText("");
      }

      if (user) {
        try {
          await deleteNote(targetId);
          setNotes((prevNotes) => prevNotes.filter((n) => n.id !== targetId));
          showToast(tDialogs("deleteNote.toastSuccess"));
        } catch (err: any) {
          setError(err.message || tErrors("deleteFailed"));
        } finally {
          setDeletingNoteId(null);
        }
      } else {
        const updatedNotes = notes.filter((n) => n.id !== targetId);
        setNotes(updatedNotes);
        sessionStorage.setItem("anonymous_notes", JSON.stringify(updatedNotes));
        setDeletingNoteId(null);
        showToast(tDialogs("deleteNote.toastSuccess"));
      }
    }, 300);
  };

  const handleUpdateNoteAction = async (skipAi: boolean, promptType?: string, customPrompt?: string) => {
    setError(null);
    const trimmed = editText.trim();
    if (!trimmed) return;

    if (trimmed.length < 10) {
      setError(tErrors("minLength"));
      return;
    }

    // BUG 3 FIX: compare trimmed against BOTH the original raw_text AND the saved AI markdown.
    // This catches whitespace-only changes regardless of which version is currently in the editor.
    const rawNormalized = selectedNote!.raw_text.trim();
    const aiNormalized = selectedNote!.structured_content?.markdown?.trim() ?? "";
    if (!promptType && !customPrompt && (trimmed === rawNormalized || trimmed === aiNormalized)) {
      setIsEditing(false);
      return;
    }

    if (user) {
      setIsUpdating(true);
      try {
        let updated: any;

        if (skipAi) {
          // "Update as-is":
          //   • raw_text gets updated to the current editor content (trimmed).
          //   • structured_content.markdown gets updated to the current editor content (trimmed).
          //   • title gets preserved.
          const existingTitle =
            selectedNote!.structured_content?.title ||
            selectedNote!.title ||
            selectedNote!.raw_text.split("\n")[0].substring(0, 30);

          updated = await updateNote(
            selectedNote!.id,
            trimmed,                                         // CURRENT editor content becomes raw_text
            true,                                            // skip_ai
            selectedNote!.category,                          // preserve existing category
            { title: existingTitle, markdown: trimmed },     // structured_content with edited text
            undefined,
            undefined
          );
        } else {
          // "Update with AI": the currently edited text becomes the new raw_text that
          // the AI will process and re-structure.
          updated = await updateNote(
            selectedNote!.id,
            trimmed,                                         // CURRENT editor content becomes raw_text
            false,                                           // skip_ai
            undefined,
            undefined,
            promptType,
            customPrompt
          );
        }

        const mappedNote: Note = {
          id: updated.id,
          raw_text: updated.raw_text,
          original_raw_text: updated.original_raw_text || updated.raw_text,
          created_at: updated.created_at,
          category: updated.category,
          title: updated.structured_content?.title || updated.raw_text.split("\n")[0].substring(0, 30),
          title_is_custom: updated.title_is_custom ?? false,
          structured_content: updated.structured_content
        };
        // Update the note in notes list
        setNotes((prevNotes) => prevNotes.map(n => n.id === mappedNote.id ? mappedNote : n));
        // Switch view back to newly organized note
        setSelectedNote(mappedNote);
        setIsEditing(false);
      } catch (err: any) {
        setError(err.message || tErrors("updateFailed"));
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Anonymous note local update (no AI)
      const existingTitle =
        selectedNote!.structured_content?.title ||
        selectedNote!.title ||
        trimmed.split("\n")[0].substring(0, 30) + (trimmed.length > 30 ? "..." : "");

      const mappedNote: Note = {
        ...selectedNote!,
        raw_text: trimmed,
        original_raw_text: selectedNote!.original_raw_text || selectedNote!.raw_text,
        title: existingTitle,
        structured_content: {
          title: existingTitle,
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


  const handleRenameTitle = async () => {
    const newTitle = titleEditValue.trim();
    if (!newTitle || !selectedNote) return;
    if (newTitle === (selectedNote.structured_content?.title || selectedNote.title)) {
      setIsTitleEditing(false);
      return;
    }

    setIsTitleSaving(true);
    const updatedNote: Note = {
      ...selectedNote,
      title: newTitle,
      title_is_custom: true,
      structured_content: selectedNote.structured_content
        ? { ...selectedNote.structured_content, title: newTitle }
        : { title: newTitle, markdown: selectedNote.raw_text }
    };

    // Optimistic update
    setSelectedNote(updatedNote);
    setNotes((prev) => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    setIsTitleEditing(false);

    if (user) {
      try {
        const result = await renameNoteTitle(selectedNote.id, newTitle);
        // Sync with server response
        const synced: Note = {
          ...updatedNote,
          title_is_custom: result.title_is_custom ?? true,
          structured_content: result.structured_content ?? updatedNote.structured_content
        };
        setSelectedNote(synced);
        setNotes((prev) => prev.map(n => n.id === synced.id ? synced : n));
      } catch (err: any) {
        setError(err.message || tErrors("renameFailed"));
        // Roll back optimistic update
        setSelectedNote(selectedNote);
        setNotes((prev) => prev.map(n => n.id === selectedNote.id ? selectedNote : n));
      }
    } else {
      // Anonymous: persist to sessionStorage
      const stored = sessionStorage.getItem("anonymous_notes");
      if (stored) {
        try {
          const parsed: Note[] = JSON.parse(stored);
          const updatedList = parsed.map(n => n.id === updatedNote.id ? updatedNote : n);
          sessionStorage.setItem("anonymous_notes", JSON.stringify(updatedList));
        } catch (e) {
          console.error("Failed to persist title rename to sessionStorage:", e);
        }
      }
    }
    setIsTitleSaving(false);
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const skipAiDefault = user ? false : true;
    handleUpdateNoteAction(skipAiDefault);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Shopping List":
        return "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-amber-500/30 dark:ring-amber-500/40";
      case "Meeting Notes":
        return "bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 ring-sky-500/30 dark:ring-sky-500/40";
      case "Lecture Notes":
        return "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 ring-purple-500/30 dark:ring-purple-500/40";
      case "Daily Plan":
        return "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30 dark:ring-emerald-500/40";
      case "Travel List":
        return "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 ring-indigo-500/30 dark:ring-indigo-500/40";
      case "Pending AI processing":
        return "bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 ring-slate-500/30 dark:ring-slate-500/40 animate-pulse";
      default:
        return "bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 ring-slate-500/30 dark:ring-slate-500/40";
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
            <em key={index} className="italic text-zinc-800 dark:text-zinc-200">
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
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-500 ${isChecked
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              title={isChecked ? tWorkspace("markAsUnchecked") : tWorkspace("markAsChecked")}
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
          <li key={idx} className="ml-4 list-disc text-sm text-zinc-700 dark:text-zinc-300 my-1 leading-relaxed">
            {parseInline(line.substring(2))}
          </li>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-2"></div>;
      }
      return (
        <p key={idx} className="text-sm text-zinc-700 dark:text-zinc-300 my-1 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    });
  };

  // If not mounted yet, render a skeleton to match server-side HTML and avoid hydration issues
  if (!mounted) {
    return (
      <div className="h-screen max-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans flex flex-col overflow-hidden">
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-2.5">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Image
                src="/mascot/logo.png"
                alt="Unstructured Notes Logo"
                width={51}
                height={28}
                className="object-contain"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
              <span>{tHeader("title")}</span>
            </div>
            <div className="w-24 h-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          </div>
        </header>
        <div className="flex max-w-7xl mx-auto p-6 gap-6">
          <div className="w-1/3 h-64 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          <div className="w-2/3 h-64 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans flex flex-col overflow-hidden">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md px-6 py-2.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Image
              src="/mascot/logo.png"
              alt="Unstructured Notes Logo"
              width={51}
              height={28}
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
            <span>{tHeader("title")}</span>
          </Link>

          <div className="flex items-center gap-3">
            {!loading && !user && (
              <Link
                href="/premium"
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 dark:text-amber-400 shadow-sm transition-all duration-200 cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-250 ease-out"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{tHeader("premium")}</span>
              </Link>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
            {loading ? (
              <div className="w-24 h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-4">
                {user.trial_ended ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
                    {tHeader("trialEnded")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    {tHeader("aiActive", { days: user.trial_days_left })}
                  </span>
                )}

                {/* Profile Dropdown Container */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 focus:outline-none transition-colors cursor-pointer"
                  >
                    <span className="h-4 w-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center font-bold text-[10px]">
                      {user.first_name ? user.first_name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : "U")}
                    </span>
                    <span className="max-w-[120px] truncate hidden sm:inline">
                      {user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.email}
                    </span>
                    <svg className="w-3 h-3 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isProfileDropdownOpen && (
                    <>
                      {/* Invisible backdrop to close the dropdown */}
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-100">
                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 text-left">
                          <p className="text-[11px] font-bold text-zinc-900 dark:text-white truncate">
                            {user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "Welcome"}
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          href="/settings"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex w-full items-center px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                        >
                          {tHeader("accountSettings")}
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogoutClick();
                          }}
                          className="flex w-full items-center px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left cursor-pointer"
                        >
                          {tHeader("signOut")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  {tHeader("signIn")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {tHeader("register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      {user && user.trial_ended && (
        <div className="bg-amber-50 border-b border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 px-6 py-2.5 text-center text-xs font-semibold text-amber-800 dark:text-amber-400">
          {tWorkspace("trialEndedHeaderNotice")}
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-6 gap-6 overflow-hidden min-h-0">
        {/* Left Sidebar: Note History */}
        <section className="w-full md:w-80 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 max-h-[300px] md:max-h-none min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 flex items-center justify-between w-full">
              <span>{tSidebar("noteHistory")}</span>
              <span className="text-xs font-normal text-zinc-500">
                {tSidebar("notesCount", { count: user ? filteredNotes.length : notes.length })}
              </span>
            </h2>
            {selectedNote && (
              <button
                onClick={() => {
                  setSelectedNote(null);
                  setError(null);
                  setIsEditing(false);
                  setIsTitleEditing(false);
                  setEditText("");
                }}
                className="ml-2 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 bg-zinc-50 dark:bg-zinc-950 transition-colors"
              >
                <span>+</span> {tSidebar("newNote")}
              </button>
            )}
          </div>

          {/* Search & Filter Controls (only if authenticated and notes exist) */}
          {user && notes.length > 0 && (
            <div className="space-y-2 mb-3 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder={tSidebar("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl pl-8 pr-8 py-1.5 text-xs text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl px-3 py-1.5 pr-8 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer appearance-none"
                >
                  <option value="All" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{tSidebar("categories.All")}</option>
                  <option value="Shopping List" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{tSidebar("categories.Shopping List")}</option>
                  <option value="Meeting Notes" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{tSidebar("categories.Meeting Notes")}</option>
                  <option value="Lecture Notes" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{tSidebar("categories.Lecture Notes")}</option>
                  <option value="Daily Plan" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{tSidebar("categories.Daily Plan")}</option>
                  <option value="Travel List" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{tSidebar("categories.Travel List")}</option>
                  <option value="General / Other" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{tSidebar("categories.General / Other")}</option>
                  <option value="Plain Text" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{tSidebar("categories.Plain Text")}</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Scrolling Note List container */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1 scrollbar-thin">
            {notes.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/30 dark:bg-zinc-950/10 my-2">
                <div className="mb-3">
                  <Image
                    src="/mascot/empty-state-resting.png"
                    alt="Sloth resting"
                    width={110}
                    height={110}
                    className="object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
                <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{tSidebar("emptyState.title")}</h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 max-w-[180px] mx-auto leading-relaxed">
                  {tSidebar("emptyState.body")}
                </p>
              </div>
            ) : user && filteredNotes.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/30 dark:bg-zinc-950/10 my-2">
                <span className="text-2xl mb-2">🔍</span>
                <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{tSidebar("noNotesFound.title")}</h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-[180px] mx-auto leading-relaxed">
                  {tSidebar("noNotesFound.body")}
                </p>
              </div>
            ) : (
              (user ? filteredNotes : notes).map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNote(note);
                    setError(null);
                    setIsEditing(false);
                    setIsTitleEditing(false);
                    setEditText(note.raw_text);
                  }}
                  className={`group relative p-4 rounded-xl border transition-all text-left cursor-pointer hover:shadow-sm active:scale-[0.98] ${deletingNoteId === note.id ? "opacity-0 scale-95 pointer-events-none duration-300" : "duration-200"
                    } ${selectedNote?.id === note.id
                      ? "border-zinc-800 bg-zinc-50/90 dark:border-zinc-300 dark:bg-zinc-950 ring-1 ring-zinc-800 dark:ring-zinc-300 shadow-sm"
                      : "border-zinc-200/60 bg-zinc-50/40 hover:bg-zinc-50/80 hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:hover:bg-zinc-950/60 dark:hover:border-zinc-700"
                    }`}
                >
                  {selectedNote?.id === note.id && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-zinc-900 dark:bg-zinc-100 rounded-r-lg" />
                  )}
                  <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 truncate pr-6">
                    {note.title || tSidebar("untitledNote")}
                  </h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-1.5 pr-6 leading-normal">
                    {getNotePreview(note)}
                  </p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-[9px] text-zinc-400">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ring-1 ring-inset ${getCategoryColor(note.category)}`}>
                      {tSidebar(`categories.${note.category}` as any)}
                    </span>
                  </div>

                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title={tSidebar("deleteNote")}
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
              ))
            )}
          </div>
        </section>

        {/* Center Workspace */}
        {selectedNote ? (
          <section className="flex-1 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-visible min-h-0">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedNote(null);
                    setError(null);
                    setIsEditing(false);
                    setIsTitleEditing(false);
                    setEditText("");
                  }}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                  title={tWorkspace("backToInput")}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div>
                  {/* Inline editable title */}
                  {isTitleEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        type="text"
                        value={titleEditValue}
                        onChange={(e) => setTitleEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); handleRenameTitle(); }
                          if (e.key === "Escape") { setIsTitleEditing(false); }
                        }}
                        onBlur={handleRenameTitle}
                        maxLength={100}
                        className="text-base font-bold bg-transparent border-b border-zinc-400 dark:border-zinc-500 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-700 dark:focus:border-zinc-300 min-w-0 w-48 sm:w-64 transition-colors"
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleRenameTitle(); }}
                        className="shrink-0 p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        title={tWorkspace("saveTitle")}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group/title">
                      <h2 className={`text-base font-bold text-zinc-900 dark:text-zinc-50 ${isTitleSaving ? "opacity-60" : ""}`}>
                        {selectedNote.structured_content?.title || selectedNote.title || tSidebar("untitledNote")}
                      </h2>
                      {selectedNote.title_is_custom && (
                        <span title={tWorkspace("customTitleTooltip")} className="text-zinc-400 dark:text-zinc-500 shrink-0">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setTitleEditValue(selectedNote.structured_content?.title || selectedNote.title || "");
                          setIsTitleEditing(true);
                        }}
                        className="opacity-0 group-hover/title:opacity-100 shrink-0 p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all"
                        title={tWorkspace("renameTitle")}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${getCategoryColor(selectedNote.category)}`}>
                      {tSidebar(`categories.${selectedNote.category}` as any)}
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
                    {tWorkspace("edit")}
                  </button>
                )}
                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  {tWorkspace("deleteNote")}
                </button>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateNote} className="flex-1 flex flex-col gap-4 overflow-visible min-h-0">
                {isUpdating && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/85 flex flex-col items-center justify-center rounded-2xl backdrop-blur-[2px] z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white mb-4"></div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white animate-pulse">
                      {user?.trial_ended ? tWorkspace("saving") : tWorkspace("organizing")}
                    </p>
                  </div>
                )}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Toggle row: label + restore toggle + formatting toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-y-1.5 mb-2">
                    <label
                      htmlFor="edit_raw_text"
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 text-left shrink-0"
                    >
                      {tWorkspace("editLabel")}
                    </label>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {/* Raw ↔ AI version toggle — only for AI-organized notes */}
                      {selectedNote &&
                        selectedNote.category !== "Plain Text" &&
                        selectedNote.structured_content?.markdown &&
                        selectedNote.structured_content.markdown.trim() !== (selectedNote.original_raw_text || selectedNote.raw_text).trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              const rawVal = selectedNote.original_raw_text || selectedNote.raw_text;
                              const aiVal = selectedNote.structured_content!.markdown;
                              // If the editor currently shows the AI version, load raw; otherwise load AI
                              const showingAi = editText.trim() === aiVal.trim();
                              setEditText(showingAi ? rawVal : aiVal);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
                            title="Switch between raw input and AI-organised version"
                          >
                            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            {editText.trim() === (selectedNote.original_raw_text || selectedNote.raw_text).trim()
                              ? tWorkspace("restoreAiVersion")
                              : tWorkspace("restoreRawText")}
                          </button>
                        )}

                      {/* Formatting Toolbar */}
                      <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
                        <button
                          type="button"
                          onClick={() => applyFormat("bold", true)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors"
                          title={tToolbars("bold")}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormat("italic", true)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs italic font-serif transition-colors"
                          title={tToolbars("italic")}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormat("underline", true)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs underline transition-colors"
                          title={tToolbars("underline")}
                        >
                          U
                        </button>
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                        <button
                          type="button"
                          onClick={() => applyFormat("heading", true)}
                          className="h-7 px-2 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-[10px] font-extrabold tracking-wider transition-colors"
                          title={tToolbars("heading")}
                        >
                          H1/H2
                        </button>
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                        <button
                          type="button"
                          onClick={() => applyFormat("bullet", true)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                          title={tToolbars("bulletList")}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormat("checklist", true)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                          title={tToolbars("checklist")}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <textarea
                    id="edit_raw_text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder={tWorkspace("editPlaceholder")}
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
                    {tWorkspace("cancel")}
                  </button>
                  {user ? (
                    user.trial_ended ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateNoteAction(true)}
                        disabled={isUpdating || !editText.trim()}
                        className="bg-zinc-900 text-white rounded-lg px-6 py-2 text-sm font-semibold shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 transition-colors"
                      >
                        {tWorkspace("update")}
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateNoteAction(true)}
                          disabled={isUpdating || !editText.trim()}
                          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                        >
                          {tWorkspace("updateAsIs")}
                        </button>
                        <div className="relative inline-flex rounded-lg shadow-sm" ref={promptDropdownRef}>
                          <button
                            type="button"
                            onClick={() => handleUpdateNoteAction(false)}
                            disabled={isUpdating || !editText.trim()}
                            className="bg-zinc-900 text-white rounded-l-lg px-5 py-2 text-sm font-semibold hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 transition-colors"
                          >
                            {tWorkspace("updateWithAi")}
                          </button>
                          <div className="w-[1px] bg-zinc-800 dark:bg-zinc-200/20 self-stretch" />
                          <button
                            type="button"
                            onClick={() => {
                              setIsPromptDropdownOpen(!isPromptDropdownOpen);
                              setPromptQuery("");
                              setSelectedPromptId(null);
                              setCustomPromptText("");
                            }}
                            disabled={isUpdating || !editText.trim()}
                            className="bg-zinc-900 text-white rounded-r-lg px-2.5 py-2 text-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 transition-colors flex items-center justify-center"
                            title="AI prompt options"
                          >
                            <svg className={`h-4 w-4 transform transition-transform ${isPromptDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>

                          {isPromptDropdownOpen && (
                            <div className="absolute right-0 bottom-full mb-2 z-[100] w-64 rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 text-left">
                              {selectedPromptId !== "custom" ? (
                                <>
                                  <div className="relative mb-2">
                                    <input
                                      type="text"
                                      value={promptQuery}
                                      onChange={(e) => setPromptQuery(e.target.value)}
                                      placeholder={tPresets("searchPlaceholder")}
                                      className="w-full bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
                                    />
                                  </div>
                                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                                    {PRESET_PROMPTS.filter(p => {
                                      const label = tPresets(`${p.id}.label`);
                                      const desc = tPresets(`${p.id}.description`);
                                      return (
                                        label.toLowerCase().includes(promptQuery.toLowerCase()) ||
                                        desc.toLowerCase().includes(promptQuery.toLowerCase())
                                      );
                                    }).map((prompt) => {
                                      const label = tPresets(`${prompt.id}.label`);
                                      const desc = tPresets(`${prompt.id}.description`);
                                      return (
                                        <button
                                          key={prompt.id}
                                          type="button"
                                          onClick={() => {
                                            if (prompt.id === "custom") {
                                              setSelectedPromptId("custom");
                                            } else {
                                              setIsPromptDropdownOpen(false);
                                              handleUpdateNoteAction(false, prompt.id);
                                            }
                                          }}
                                          className="w-full text-left flex items-start gap-2 px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                                        >
                                          <span className="text-sm select-none">{prompt.icon}</span>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{desc}</p>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-900">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{tPresets("customInstruction")}</span>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPromptId(null)}
                                      className="text-[10px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-semibold"
                                    >
                                      {tPresets("back")}
                                    </button>
                                  </div>
                                  <textarea
                                    value={customPromptText}
                                    onChange={(e) => setCustomPromptText(e.target.value)}
                                    placeholder={tPresets("customPlaceholder")}
                                    rows={3}
                                    maxLength={500}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 resize-none"
                                  />
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[10px] ${500 - customPromptText.length < 50 ? "text-red-500" : "text-zinc-400 dark:text-zinc-500"}`}>
                                      {tWorkspace("charsLeft", { count: 500 - customPromptText.length })}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (customPromptText.trim()) {
                                          setIsPromptDropdownOpen(false);
                                          handleUpdateNoteAction(false, undefined, customPromptText);
                                          setCustomPromptText("");
                                          setSelectedPromptId(null);
                                        }
                                      }}
                                      disabled={!customPromptText.trim() || isUpdating}
                                      className="bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                    >
                                      {tWorkspace("submit")}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateNoteAction(true)}
                      disabled={isUpdating || !editText.trim()}
                      className="bg-zinc-900 text-white rounded-lg px-6 py-2 text-sm font-semibold shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 transition-colors"
                    >
                      {tWorkspace("update")}
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
                  <div className="text-left whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    {selectedNote.raw_text}
                  </div>
                )}

                {selectedNote.structured_content?.markdown && (
                  <details className="mt-8 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <summary className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer font-semibold outline-none select-none">
                      {tWorkspace("showRawText")}
                    </summary>
                    <div className="mt-3 text-left whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono">
                      {selectedNote.raw_text}
                    </div>
                  </details>
                )}
              </div>
            )}
          </section>
        ) : (
          <section className="flex-1 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-visible min-h-0">
            {isOrganizing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/85 flex flex-col items-center justify-center rounded-2xl backdrop-blur-[2px] z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white mb-4"></div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white animate-pulse">
                  {user?.trial_ended ? tWorkspace("saving") : tWorkspace("organizing")}
                </p>
              </div>
            )}
            <form onSubmit={handleSaveNote} className="flex-1 flex flex-col gap-4 overflow-visible min-h-0">
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="raw_text"
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                  >
                    {tWorkspace("writeLabel")}
                  </label>

                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => applyFormat("bold", false)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors"
                      title={tToolbars("bold")}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("italic", false)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs italic font-serif transition-colors"
                      title={tToolbars("italic")}
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("underline", false)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs underline transition-colors"
                      title={tToolbars("underline")}
                    >
                      U
                    </button>
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => applyFormat("heading", false)}
                      className="h-7 px-2 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-[10px] font-extrabold tracking-wider transition-colors"
                      title={tToolbars("heading")}
                    >
                      H1/H2
                    </button>
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => applyFormat("bullet", false)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                      title={tToolbars("bulletList")}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("checklist", false)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                      title={tToolbars("checklist")}
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
                  placeholder={tWorkspace("writePlaceholder")}
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
                        <span>{tWorkspace("trialEndedNotice")}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <span>✨</span>
                        <span>{tWorkspace("trialActiveNotice")}</span>
                      </p>
                    )
                  ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 flex-wrap">
                      <span>🔒</span>
                      <span>{tWorkspace("anonymousNotice")}</span>
                      <Link href="/login" className="font-semibold underline hover:text-zinc-900 dark:hover:text-zinc-50">
                        {tWorkspace("anonymousNoticeLink")}
                      </Link>
                      <span>{tWorkspace("anonymousNoticeSuffix")}</span>
                    </p>
                  )}
                </div>
                {user ? (
                  user.trial_ended ? (
                    <button
                      type="button"
                      onClick={() => handleSaveNoteAction(true)}
                      disabled={!noteText.trim()}
                      className="w-full sm:w-auto bg-zinc-900 text-white rounded-lg px-6 py-2 text-sm font-semibold shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 transition-colors"
                    >
                      {tWorkspace("saveNote")}
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleSaveNoteAction(true)}
                        disabled={!noteText.trim()}
                        className="w-full sm:w-auto rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        {tWorkspace("saveAsIs")}
                      </button>
                      <div className="relative inline-flex rounded-lg shadow-sm" ref={savePromptDropdownRef}>
                        <button
                          type="button"
                          onClick={() => handleSaveNoteAction(false)}
                          disabled={!noteText.trim()}
                          className="bg-zinc-900 text-white rounded-l-lg px-5 py-2 text-sm font-semibold hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 transition-colors"
                        >
                          {tWorkspace("saveWithAi")}
                        </button>
                        <div className="w-[1px] bg-zinc-800 dark:bg-zinc-200/20 self-stretch" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsSavePromptDropdownOpen(!isSavePromptDropdownOpen);
                            setSavePromptQuery("");
                            setSelectedSavePromptId(null);
                            setCustomSavePromptText("");
                          }}
                          disabled={!noteText.trim()}
                          className="bg-zinc-900 text-white rounded-r-lg px-2.5 py-2 text-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 transition-colors flex items-center justify-center"
                          title="AI prompt options"
                        >
                          <svg className={`h-4 w-4 transform transition-transform ${isSavePromptDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>

                        {isSavePromptDropdownOpen && (
                          <div className="absolute right-0 bottom-full mb-2 z-[100] w-64 rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 text-left">
                            {selectedSavePromptId !== "custom" ? (
                              <>
                                <div className="relative mb-2">
                                  <input
                                    type="text"
                                    value={savePromptQuery}
                                    onChange={(e) => setSavePromptQuery(e.target.value)}
                                    placeholder={tPresets("searchPlaceholder")}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
                                  />
                                </div>
                                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                                  {PRESET_PROMPTS.filter(p => {
                                    const label = tPresets(`${p.id}.label`);
                                    const desc = tPresets(`${p.id}.description`);
                                    return (
                                      label.toLowerCase().includes(savePromptQuery.toLowerCase()) ||
                                      desc.toLowerCase().includes(savePromptQuery.toLowerCase())
                                    );
                                  }).map((prompt) => {
                                    const label = tPresets(`${prompt.id}.label`);
                                    const desc = tPresets(`${prompt.id}.description`);
                                    return (
                                      <button
                                        key={prompt.id}
                                        type="button"
                                        onClick={() => {
                                          if (prompt.id === "custom") {
                                            setSelectedSavePromptId("custom");
                                          } else {
                                            setIsSavePromptDropdownOpen(false);
                                            handleSaveNoteAction(false, prompt.id);
                                          }
                                        }}
                                        className="w-full text-left flex items-start gap-2 px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                                      >
                                        <span className="text-sm select-none">{prompt.icon}</span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
                                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{desc}</p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-900">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{tPresets("customInstruction")}</span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSavePromptId(null)}
                                    className="text-[10px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-semibold"
                                  >
                                    {tPresets("back")}
                                  </button>
                                </div>
                                <textarea
                                  value={customSavePromptText}
                                  onChange={(e) => setCustomSavePromptText(e.target.value)}
                                  placeholder={tPresets("customPlaceholder")}
                                  rows={3}
                                  maxLength={500}
                                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 resize-none"
                                />
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] ${500 - customSavePromptText.length < 50 ? "text-red-500" : "text-zinc-400 dark:text-zinc-500"}`}>
                                    {tWorkspace("charsLeft", { count: 500 - customSavePromptText.length })}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (customSavePromptText.trim()) {
                                        setIsSavePromptDropdownOpen(false);
                                        handleSaveNoteAction(false, undefined, customSavePromptText);
                                        setCustomSavePromptText("");
                                        setSelectedSavePromptId(null);
                                      }
                                    }}
                                    disabled={!customSavePromptText.trim()}
                                    className="bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                  >
                                    {tWorkspace("submit")}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveNoteAction(true)}
                    disabled={!noteText.trim()}
                    className="w-full sm:w-auto bg-zinc-900 text-white rounded-lg px-6 py-2 text-sm font-semibold shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 transition-colors"
                  >
                    {tWorkspace("saveNote")}
                  </button>
                )}
              </div>
            </form>
          </section>
        )}
      </main>

      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      <DeleteConfirmationDialog
        isOpen={noteIdToDelete !== null}
        onClose={() => setNoteIdToDelete(null)}
        onConfirm={executeDeleteNote}
      />

      <SignOutConfirmationDialog
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={executeLogout}
      />

      {toastMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 px-4 py-2.5 rounded-xl shadow-lg border border-zinc-800 dark:border-zinc-200 text-xs font-semibold flex items-center gap-2 transition-all duration-300 transform ${toastVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
            }`}
        >
          <span>✅</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const t = useTranslations("Onboarding");
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
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
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
              <div className="relative w-full h-52 mb-6">
                <Image
                  src="/mascot/onboarding-organize.png"
                  alt="Sloth organizing notes"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {t("step1.title")}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("step1.body")}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="relative w-full h-52 mb-6">
                <Image
                  src="/mascot/working-on.png"
                  alt="Sloth thinking and working"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {t("step2.title")}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("step2.body")}
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="relative w-full h-52 mb-6">
                <Image
                  src="/mascot/success-thumbsup.png"
                  alt="Celebrating sloth"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {t("step3.title")}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("step3.body")}
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
                className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${step === s
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
                {t("back")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                {t("maybeLater")}
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 ml-auto"
              >
                {t("next")}
              </button>
            ) : (
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors sm:hidden"
                >
                  {t("maybeLater")}
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {t("signUp")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmationDialog({ isOpen, onClose, onConfirm }: DeleteConfirmationDialogProps) {
  const t = useTranslations("Dialogs.deleteNote");
  const [animateShow, setAnimateShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => setAnimateShow(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setAnimateShow(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-200 ${animateShow ? "opacity-100" : "opacity-0"
        }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl transition-all duration-200 transform ${animateShow ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t("title")}</h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {t("body")}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            autoFocus
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors focus:ring-2 focus:ring-zinc-500 focus:outline-none"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 sm:flex-initial rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 text-sm font-semibold transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none"
          >
            {t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SignOutConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function SignOutConfirmationDialog({ isOpen, onClose, onConfirm }: SignOutConfirmationDialogProps) {
  const t = useTranslations("Dialogs.signOut");
  const [animateShow, setAnimateShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => setAnimateShow(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setAnimateShow(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-200 ${animateShow ? "opacity-100" : "opacity-0"
        }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl transition-all duration-200 transform text-center ${animateShow ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex justify-center mb-4">
          <Image
            src="/mascot/logout-goodby.png"
            alt="Sloth waving goodbye"
            width={120}
            height={120}
            className="object-contain"
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t("title")}</h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {t("body")}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            autoFocus
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors focus:ring-2 focus:ring-zinc-500 focus:outline-none"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 sm:flex-initial rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 text-sm font-semibold transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none"
          >
            {t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

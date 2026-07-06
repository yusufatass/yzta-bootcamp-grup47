-- Draft Schema for Unstructured Notes Organizer

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notes Table definition
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- Fixed categories: 'Shopping List', 'Meeting Notes', 'Lecture Notes', 'Daily Plan', 'Travel List', 'General / Other'
    structured_content JSONB NOT NULL, -- Houses structured content like markdown sections, headings, bullet points
    title_is_custom BOOLEAN NOT NULL DEFAULT FALSE, -- True when the user has manually renamed the title; AI updates will not overwrite it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Run this migration on existing databases:
-- ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS title_is_custom BOOLEAN NOT NULL DEFAULT FALSE;

-- Enable Row Level Security (RLS) so users can only read/write their own notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own notes
CREATE POLICY "Allow users to read their own notes" 
    ON public.notes 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own notes
CREATE POLICY "Allow users to insert their own notes" 
    ON public.notes 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own notes
CREATE POLICY "Allow users to update their own notes" 
    ON public.notes 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policy to allow users to delete their own notes
CREATE POLICY "Allow users to delete their own notes" 
    ON public.notes 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Index on user_id for faster retrieval of note history
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);

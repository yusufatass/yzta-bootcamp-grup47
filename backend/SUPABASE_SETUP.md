# Supabase Setup Guide

This guide details the manual steps to set up the Supabase project, configure Authentication, and initialize the database schema for the Unstructured Notes Organizer.

## 1. Create a Supabase Project

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New Project** and select your Organization.
3. Fill in the project details:
   - **Name**: `unstructured-notes-organizer` (or similar)
   - **Database Password**: Generate a secure password and store it safely.
   - **Region**: Select a region close to your target audience.
   - **Pricing Plan**: Free Tier is sufficient for this bootcamp project.
4. Click **Create new project** and wait for provisioning to finish (usually 1-2 minutes).

## 2. Configure Authentication

We use email/password sign-up with email verification (which is required by the critical product rules before granting AI access).

1. In the Supabase sidebar, go to **Authentication** -> **Providers**.
2. Verify that the **Email** provider is enabled.
3. Ensure that **Confirm email** is toggled **ON** (checked). This is a critical product requirement. Users must verify their email before accessing AI features.
4. Configure redirects if necessary under **Authentication** -> **Redirects** (usually defaults to localhost during development).

## 3. Initialize Database Schema

1. In the Supabase sidebar, navigate to the **SQL Editor**.
2. Click **New query** (or "Create a new query").
3. Copy the contents of the `backend/schema.sql` file and paste them into the SQL editor text area.
4. Click **Run** to execute the script.
5. Verify that the `notes` table is successfully created under public schema, along with its RLS (Row Level Security) policies and indexes.

## 4. Obtain API Keys & Environment Setup

1. In the Supabase sidebar, go to **Project Settings** -> **API**.
2. Copy the following keys and update your local `.env` files (based on `.env.example` templates):
   - **Project URL**: Copy and set as:
     - Frontend: `NEXT_PUBLIC_SUPABASE_URL`
     - Backend: `SUPABASE_URL`
   - **Anon/Public API key**: (under `Project API keys` -> `anon public`) Copy and set as:
     - Frontend: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Backend: `SUPABASE_ANON_KEY`
   - **Service Role API key**: (under `Project API keys` -> `service_role secret`) Copy and set as:
     - Backend: `SUPABASE_SERVICE_ROLE_KEY`

## 5. Applying Migrations to an Existing Database

When the schema evolves after the initial setup, apply the following migrations via **SQL Editor → New query → Run**:

### Migration 001 — Add `title_is_custom` column (for manual title rename feature)

```sql
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS title_is_custom BOOLEAN NOT NULL DEFAULT FALSE;
```

### Migration 002 — Add `original_raw_text` column (for original unstructured text toggle)

```sql
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS original_raw_text TEXT;

-- For existing notes, copy raw_text to original_raw_text
UPDATE public.notes
  SET original_raw_text = raw_text
  WHERE original_raw_text IS NULL;
```

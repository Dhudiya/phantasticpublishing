# Supabase Database Integration Setup

This project is now connected to Supabase for database management.

## Configuration

Your Supabase credentials have been added to `.env.local`:
- **URL**: https://vzfammhxwgymbsgypunr.supabase.co
- **Publishable Key**: sb_publishable_BQjZWo2QcLcKJqJTlK8Mnw_2lNQHMek

## Usage

Import the Supabase client in your components:

\`\`\`typescript
import { supabase } from '@/lib/supabase'

// Example: Query data
const { data, error } = await supabase
  .from('your_table')
  .select('*')
\`\`\`

## Available Files

- `.env.local` - Your Supabase credentials (DO NOT COMMIT)
- `.env.example` - Template for environment variables
- `src/lib/supabase.ts` - Supabase client initialization

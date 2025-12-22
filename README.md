# Sattva Call Analysis

This is a project developed by Tasknova for Sattva Human. It manages calls and their analysis.

## Overview

A comprehensive call management and analysis system that handles call recording ingestion, transcription, AI-powered analysis, and provides dashboards for different user roles (Admin, Manager, Employee).

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Custom authentication system

## Getting Started

### Prerequisites
- Node.js 18+ recommended
- npm

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## Project Structure

- `src/components/` - React components and dashboards
- `src/pages/` - Page components
- `src/lib/` - Supabase client and utilities
- `supabase/` - Database migrations and Edge Functions
- `db/` - Additional database scripts

## Features

- Call recording capture and storage
- Automated transcription
- AI-powered call analysis
- Role-based dashboards (Admin, Manager, Employee)
- Client and job management
- Employee productivity tracking

\# FilmRoom - Ultimate Frisbee Film Review Platform



\## Project Overview

FilmRoom is a web application for ultimate frisbee players and teams to rewatch, analyze, and collaboratively review game film. Originally built in Cursor, now maintained with Claude Code.



\## Tech Stack



\### Frontend

\- Next.js 14+ (App Router)

\- React with TypeScript

\- Tailwind CSS for styling

\- Lucide React for icons



\### Backend

\- Next.js API Routes (serverless functions)

\- NextAuth.js for authentication (JWT-based)

\- bcryptjs for password hashing



\### Database

\- Neon (PostgreSQL database) - migrated from Supabase

\- Prisma ORM v6 for database management



\### Real-Time Features

\- Socket.io (via custom Next.js server in `server.js`)

\- WebSockets for live collaboration features



\### Video

\- YouTube IFrame API for embedded video playback



\### Utilities

\- Zod for validation

\- date-fns for date handling



\### Development \& Deployment

\- TypeScript for type safety

\- ESLint for code linting

\- Prisma Studio for database GUI

\- Vercel for hosting

\- GitHub for version control



\## Project Structure

```

/app                 # Next.js App Router pages and layouts

/components          # React components

/lib                 # Utility functions and shared code

/prisma              # Database schema and migrations

/public              # Static assets

/api                 # API routes (if not in /app/api)

server.js            # Custom Next.js server for Socket.io

```



\## Development Setup

```bash

\# Install dependencies

npm install



\# Set up environment variables

\# Create .env file with:

\# - DATABASE\_URL (Neon PostgreSQL)

\# - NEXTAUTH\_SECRET

\# - NEXTAUTH\_URL



\# Run Prisma migrations

npx prisma migrate dev



\# Start development server (with Socket.io)

npm run dev

```



\## Current Phase

Making targeted feature adjustments and small additions. No major architectural changes planned.



\## Key Features

\- Video playback using YouTube IFrame API

\- Real-time collaborative film review

\- User authentication and session management

\- \[Add other specific features]



\## Important Notes

\- Uses custom server.js for Socket.io integration (not standard Next.js dev server)

\- Database migrated from Supabase to Neon - check for any legacy references

\- JWT-based auth via NextAuth.js

\- Real-time features depend on WebSocket connection

* Do not push anything to GitHub without user confirmation



\## Database

\- Run `npx prisma studio` to view/edit database

\- Run `npx prisma migrate dev` after schema changes

\- Check `prisma/schema.prisma` for current data model



\## Testing

\[Add any testing commands or notes]



\## Deployment

\- Deployed on Vercel

\- Ensure environment variables are set in Vercel dashboard

\- Socket.io may require special Vercel configuration


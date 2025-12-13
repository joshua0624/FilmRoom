# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/filmroom?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

## Generating NEXTAUTH_SECRET

On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
```

On Mac/Linux:
```bash
openssl rand -base64 32
```

## Database Setup

1. Create a PostgreSQL database named `filmroom` (or update the DATABASE_URL accordingly)
2. Run migrations: `npm run prisma:migrate`
3. The migrations will create all necessary tables


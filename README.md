# Pathly - AI-Powered Transit Companion

An AI-powered transit companion for international students in Ontario, helping them find safe, weather-aware routes and travel buddies for late-night journeys.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
- **Authentication**: Clerk (with student email verification)
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **Font**: Geist Sans & Mono
- **Deployment**: Vercel

## 📋 Features

### ✅ **Currently Implemented**
- **Modern UI** with Geist font and dark/light mode
- **Authentication** with Clerk (sign-up, sign-in, user management)
- **Database** with Drizzle ORM and PostgreSQL schema
- **User Management** with automatic user sync between Clerk and database
- **Protected Routes** (Dashboard, Profile)
- **Responsive Design** with Tailwind CSS

### 🔄 **Coming Next**
- AI-powered route planning with OpenAI
- Interactive maps with Mapbox
- Safety reporting system
- Travel buddy matching
- Weather integration
- Real-time chat system

## 🗄️ Database Schema

```sql
-- Users table
users (id, email, university, first_name, last_name, created_at)

-- Safety reports from community
safety_reports (id, user_id, stop_id, rating, comment, incident_type, lat, lng, created_at)

-- Travel buddy requests
buddy_requests (id, requester_id, partner_id, from_address, to_address, travel_time, status, created_at)

-- In-app messaging
messages (id, buddy_request_id, sender_id, content, created_at)
```

## 🔧 Setup Instructions

### 1. Clone and Install
```bash
git clone <your-repo>
cd pathly
npm install
```

### 2. Environment Variables
Create `.env.local` with:
```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgres_connection_string

# Future APIs
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
OPENWEATHER_API_KEY=your_openweather_key
```

### 3. Database Setup
```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Open Drizzle Studio
npm run db:studio
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app!

## 📱 Pages

- **`/`** - Landing page with hero section and auth
- **`/dashboard`** - Protected dashboard with quick actions
- **`/profile`** - User profile and preferences
- **`/api/test-db`** - Database connectivity test endpoint

## 🎨 Design System

- **Colors**: Uses CSS variables for theming
- **Typography**: Geist Sans for UI, Geist Mono for code
- **Components**: shadcn/ui components with Tailwind CSS
- **Icons**: Lucide React icons
- **Responsive**: Mobile-first design

## 🔐 Authentication Flow

1. User visits landing page
2. Clicks "Sign Up" → Clerk modal opens
3. User creates account with email verification
4. Redirected to dashboard
5. User data automatically synced to database
6. Access to protected routes granted

## 📊 Database Operations

- **User Sync**: Automatic sync between Clerk and database
- **Type Safety**: Full TypeScript support with Drizzle
- **Migrations**: Version-controlled schema changes
- **Connection Pooling**: Supabase transaction pooler for serverless

## 🚧 Next Development Phase

1. **AI Chat Interface** - Vercel AI SDK + OpenAI
2. **Interactive Maps** - Mapbox GL JS integration
3. **Route Planning** - AI-powered route suggestions
4. **Safety Features** - Community reporting system
5. **Buddy Matching** - Real-time travel companion matching
6. **Weather Integration** - Weather-aware route planning

## 🔍 API Endpoints

- **`GET /api/test-db`** - Test database connectivity
- **`POST /api/chat`** - AI chat interface (coming soon)
- **`GET/POST /api/safety`** - Safety reports (coming soon)
- **`GET/POST /api/buddy`** - Buddy matching (coming soon)

## 🎯 Target Users

- International students in Ontario
- Late-night commuters seeking safety
- Students unfamiliar with local transit
- Anyone wanting community-verified route safety

## 📈 Success Metrics

- User sign-ups and retention
- Route planning requests
- Safety reports submitted
- Buddy matches made
- User engagement during evening hours

---

**Made for students, by students.** 🎓

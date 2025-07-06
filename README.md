# Pathly - Safety-First Transit Companion

A safety-first transit companion for international students in Toronto, featuring real crime data visualization, intelligent routing, and multi-modal transit directions.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Mapping**: Mapbox GL JS + Google Maps APIs + Turf.js
- **Authentication**: Clerk (with student email verification)
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **Font**: Geist Sans & Mono
- **Deployment**: Vercel

## ✅ Features

### **Interactive Safety Mapping**
- **Crime Data Visualization**: Real Toronto crime data (June-Aug 2024) processed into risk-level hexagons
- **3D Interactive Maps**: Mapbox GL with 3D buildings and smooth navigation
- **Risk Level Display**: Color-coded hexagons (green=safe, orange=caution, red=avoid)
- **Crime Details**: Click hexagons to see crime counts, types, and risk scores

### **Smart Multi-Modal Routing**
- **Transit Directions**: TTC integration with real departure times and line colors
- **Multiple Transport Modes**: Driving, walking, cycling, and public transit
- **Flexible Scheduling**: "Leave at" vs "Arrive by" time preferences
- **Route Alternatives**: Multiple route options with detailed step-by-step directions
- **Transfer Details**: Platform information and walking directions between stations

### **Intelligent Search & Places**
- **Natural Search**: "Coffee near me" finds nearby places with custom emoji markers
- **Instant Routing**: Click any place for immediate route calculation
- **Google Places Integration**: Rich place data with ratings, hours, and photos
- **Search Suggestions**: Real-time search with Mapbox geocoding

### **User Experience**
- **Modern UI**: Dark theme optimized for night use
- **Responsive Design**: Mobile-first approach for on-the-go use
- **Protected Routes**: Secure dashboard and profile pages
- **Real-time Updates**: Live data synchronization

## 🗄️ Database Schema

```sql
-- Users table with university verification
users (id, email, university, first_name, last_name, created_at)

-- Future expansion tables
safety_reports (id, user_id, location, rating, incident_type, created_at)
buddy_requests (id, requester_id, from_address, to_address, travel_time, status)
```

## 🔧 Setup Instructions

### 1. Clone and Install
```bash
git clone <repo-url>
cd pathly
npm install
```

### 2. Environment Variables
Create `.env.local`:
```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
DATABASE_URL=your_postgres_url

# Mapbox & Google Maps
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 3. Database Setup
```bash
npm run db:generate
npm run db:migrate
npm run db:studio # Optional: view database
```

### 4. Process Crime Data (Optional)
```bash
node scripts/generate-hex-grid.js
```

### 5. Run Development Server
```bash
npm run dev
```

## 📱 App Structure

- **`/`** - Landing page with authentication
- **`/map`** - Main mapping interface (protected)
- **`/dashboard`** - User dashboard (protected)
- **`/profile`** - User profile and settings (protected)

## 🎨 Key Components

- **MapContainer** - Main mapping orchestrator
- **MapView** - Mapbox GL JS integration
- **SearchBar** - Intelligent search with suggestions
- **TransportToggle** - Multi-modal transport selection
- **DirectionsPanel** - Detailed route instructions
- **HeatmapControl** - Crime data overlay controls

## 📊 Crime Data Processing

Using **Turf.js**, we process 50,000+ Toronto crime incidents:
1. **Hexagonal Tessellation**: 0.2km cells for optimal granularity
2. **Risk Scoring**: Weighted by crime severity (robbery=1.5x, theft=1.0x)
3. **Percentile Distribution**: Dynamic risk levels based on data distribution
4. **File Optimization**: Reduced from 14.8MB to 3.7MB

## 🔄 API Endpoints

- **`POST /api/directions`** - Google Maps routing with transit support
- **`POST /api/places`** - Google Places nearby search
- **`GET /api/test-db`** - Database connectivity test

## 🚧 Future Roadmap

- **AI Natural Language Routing**: "Get me to campus safely after 10 PM"
- **Predictive Risk Modeling**: ML-powered safety forecasting
- **Buddy Matching**: Connect students traveling similar routes
- **Real-time Incident Reporting**: Community-driven safety updates
- **Campus Partnerships**: Integration with university safety offices

## 🎯 Built For

- International students in Toronto
- Late-night commuters prioritizing safety
- Anyone seeking community-verified route information
- Students unfamiliar with local transit systems

---

**Safety first, always.** 🛡️ Made for students, by students. 🎓

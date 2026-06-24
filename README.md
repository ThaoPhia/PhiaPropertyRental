# PhiaRentalLLC - Next.js Real Estate Management Application

A modern Next.js application for managing and displaying properties (apartments and duplexes) with a comprehensive CMS interface and SQLite database integration.

## Features

- 🏠 **Property Listing**: Display all properties with detailed information
- 🔍 **Advanced Filtering**: Filter properties by type and city
- 📝 **CMS Management**: Create, read, update, and delete properties
- 🖼️ **Property Galleries**: Upload and browse multiple images per property
- 🔐 **CMS Authentication**: Admin-only CMS login with cookie sessions
- 🗄️ **SQLite Database**: File-based persistent data storage with proper schema
- 📱 **Responsive Design**: Beautiful UI with Tailwind CSS
- 🎯 **Property Details**: Comprehensive property pages with high-quality information
- 🚀 **Modern Stack**: Built with Next.js 14+, TypeScript, and React

## Tech Stack

- **Frontend**: Next.js 14+, React 18+, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite
- **Driver**: better-sqlite3
- **Image Optimization**: Next.js Image component

## Prerequisites

Before you begin, make sure you have:

- Node.js 18+ installed
- No external database server required (SQLite file)
- npm or yarn package manager

## Installation & Setup

### 1. Database Setup

SQLite is file-based and initialized automatically at startup. By default, the app uses:

- `./database/phiarentalllc.db`

If the database is empty, the app creates the `properties` table and inserts sample data.

### 2. Environment Configuration

Update the `.env.local` file:

```bash
SQLITE_DB_PATH=./database/phiarentalllc.db
NEXT_PUBLIC_API_URL=http://localhost:3000
CMS_ADMIN_PASSWORD=replace-with-a-strong-password
```

Admin login email is fixed to: `thoj.phia@gmail.com`

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
PhiaRentalLLC/
├── app/
│   ├── api/
│   │   └── properties/
│   │       ├── route.ts          # GET all, POST new properties
│   │       └── [id]/
│   │           └── route.ts      # GET, PUT, DELETE individual property
│   │   └── auth/
│   │       ├── login/route.ts    # Admin login
│   │       └── logout/route.ts   # Admin logout
│   ├── cms/
│   │   ├── login/page.tsx        # CMS login page
│   │   ├── page.tsx              # CMS dashboard (protected)
│   │   └── [id]/
│   │       └── page.tsx          # Edit property page (protected)
│   ├── properties/
│   │   ├── page.tsx              # Property listing page
│   │   └── [id]/
│   │       └── page.tsx          # Property detail page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── PropertyCard.tsx          # Property card component
│   ├── PropertyForm.tsx          # Create/edit form
│   └── PropertyFilters.tsx       # Filter component
├── lib/
│   ├── db.ts                     # SQLite database initialization
│   ├── auth.ts                   # Session/cookie auth helpers
│   └── password.ts               # Password hashing/verification
│   └── types.ts                  # TypeScript interfaces
├── database/
│   └── schema.sql                # Database schema
├── public/                       # Static assets
├── .env.local                    # Environment variables
└── package.json
```

## API Routes

### Get All Properties
```
GET /api/properties?type=apartment&city=New%20York
```

### Get Single Property
```
GET /api/properties/[id]
```

### Create Property
```
POST /api/properties
Content-Type: multipart/form-data

name=Downtown Duplex
type=duplex
address=123 Main St
city=New York
state=NY
zipCode=10001
bedrooms=3
bathrooms=2
squareFeet=2000
price=450000
description=Beautiful duplex...
images=<file>,<file>,...
```

> Requires authenticated admin session.

### Update Property
```
PUT /api/properties/[id]
Content-Type: multipart/form-data

name=Updated Name
...
images=<file>,<file>,...
```

> Requires authenticated admin session.

### Delete Property
```
DELETE /api/properties/[id]
```

> Requires authenticated admin session.

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "thoj.phia@gmail.com",
  "password": "your-cms-admin-password"
}
```

## Database Schema

### Properties Table

```sql
CREATE TABLE properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('duplex', 'apartment', 'other')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zipCode TEXT NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms REAL NOT NULL,
  squareFeet INTEGER NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  image_url TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE property_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE,
  UNIQUE(property_id, image_url)
);
```

## Usage

### Viewing Properties

1. Navigate to `http://localhost:3000`
2. Click "Browse Properties" or go directly to `/properties`
3. Use the filter panel to search by type and city

### Managing Properties (CMS)

1. Navigate to `/cms/login`
2. Sign in with email `thoj.phia@gmail.com` and your `CMS_ADMIN_PASSWORD`
3. **Create**: Click "Add Property" to create a new listing
4. **Read**: View all properties in the list
5. **Update**: Click "Edit" on any property detail page to add or remove images
6. **Delete**: Click "Delete" on the property detail page

## Available Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

## Common Issues

### Database Connection Failed
- Check `SQLITE_DB_PATH` in `.env.local`
- Ensure the `database/` folder is writable
- Delete `database/phiarentalllc.db` to force a fresh re-initialization

### Image Not Displaying
- Verify image URL is accessible
- Check Next.js Image configuration in `next.config.js`
- For local images, place them in `/public` folder

### Port 3000 Already in Use
```bash
npm run dev -- -p 3001
```

## Performance Tips

- Images are optimized using Next.js Image component
- Database queries are local and low-latency with SQLite
- Filtering is done server-side for efficiency
- Consider adding pagination for large datasets

## Future Enhancements

- [ ] Multi-user authentication and role management
- [ ] Photo gallery with multiple images per property
- [ ] Advanced search with price range and amenities
- [ ] Email notifications for property updates
- [ ] Export/import functionality
- [ ] Analytics dashboard
- [ ] Favorites/wishlist feature
- [ ] Map integration with property locations

## Security Considerations

- Always sanitize user inputs (already handled by prepared statements)
- Use HTTPS in production
- CMS access is restricted to authenticated admin sessions
- Keep `.env.local` out of git and configure `SQLITE_DB_PATH` per environment
- Use environment-specific configurations

## Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel settings
4. Deploy with one click

### Self-hosted

1. Build the project: `npm run build`
2. Start the server: `npm start`
3. Use a process manager like PM2: `pm2 start npm --name "phia" -- start`

## License

This project is proprietary to PhiaRentalLLC.

## Support

For issues or questions, please contact the development team.

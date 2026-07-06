# File Structure and Descriptions for PhiaRental

## 📄 Documentation Files

- **README.md** - Comprehensive documentation with setup instructions, API routes, and deployment info
- **QUICK_START.md** - Quick start guide for rapid setup
- **PROJECT_SUMMARY.md** - This project summary with key features and status
- **FILE_MANIFEST.md** - This file - complete file structure reference

## 🎨 UI Pages

### Home Page
- **app/page.tsx** - Landing page with hero section and feature highlights

### Property Browsing
- **app/properties/page.tsx** - List all properties with filtering capabilities
- **app/properties/[id]/page.tsx** - Single property detail page with actions

### CMS Management
- **app/cms/page.tsx** - CMS dashboard for managing properties
- **app/cms/[id]/page.tsx** - Edit existing property page

## ⚙️ API Routes

### Properties API
- **app/api/properties/route.ts** - GET all properties, POST new property
- **app/api/properties/[id]/route.ts** - GET, PUT, DELETE single property

## 🧩 React Components

- **components/PropertyCard.tsx** - Displays property in card format
- **components/PropertyForm.tsx** - Form for creating/editing properties
- **components/PropertyFilters.tsx** - Filter component for searching

## 🗂️ Utilities and Types

- **lib/db.ts** - SQLite database initialization and configuration
- **lib/types.ts** - TypeScript interfaces (Property, PropertyFormData)

## 🗄️ Database

- **database/schema.sql** - SQLite database schema with sample data

## ⚙️ Configuration Files

- **.env.local** - Environment variables (database credentials) - CREATE THIS
- **tsconfig.json** - TypeScript configuration with path aliases
- **next.config.ts** - Next.js configuration
- **package.json** - Project dependencies and scripts
- **postcss.config.mjs** - PostCSS configuration for Tailwind
- **tailwind.config.ts** - Tailwind CSS configuration
- **.gitignore** - Git ignore patterns
- **.eslintrc.json** - ESLint configuration

## 📦 Dependencies

### Core
- next@16+ - React framework
- react@18+ - UI library
- react-dom@18+ - React DOM library
- typescript - Type checking

### Database
- better-sqlite3 - SQLite database driver

### Styling
- tailwindcss - Utility-first CSS framework
- postcss - CSS processor

### Development
- eslint - Code linting
- @types/node - Node.js types
- @types/react - React types

## 📁 Directory Structure

```
PhiaRental/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   └── properties/
│   │       ├── route.ts
│   │       └── [id]/
│   │           └── route.ts
│   ├── cms/                      # CMS pages
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── properties/               # Public properties pages
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── PropertyCard.tsx
│   ├── PropertyForm.tsx
│   └── PropertyFilters.tsx
├── lib/                          # Utility functions and types
│   ├── db.ts
│   └── types.ts
├── database/                     # Database files
│   └── schema.sql
├── public/                       # Static assets
├── node_modules/                 # Dependencies (auto-generated)
├── .next/                        # Build output (auto-generated)
├── .env.local                    # Environment variables (CREATE THIS)
├── .eslintrc.json
├── .gitignore
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── README.md
├── QUICK_START.md
├── PROJECT_SUMMARY.md
└── FILE_MANIFEST.md              # This file
```

## 🔄 How the Application Works

### Request Flow
1. User visits URL (e.g., `/properties`)
2. Next.js renders the page component
3. Page fetches data from API routes (`/api/properties`)
4. API routes query SQLite database
5. Components render with fetched data

### Database Operations
1. **Create**: CMS form → POST /api/properties → SQLite INSERT
2. **Read**: List page → GET /api/properties → SQLite SELECT
3. **Update**: Edit form → PUT /api/properties/[id] → SQLite UPDATE
4. **Delete**: Detail page → DELETE /api/properties/[id] → SQLite DELETE

## 🚀 Getting Started Checklist

- [ ] (Optional) Update `SQLITE_DB_PATH` in `.env.local`
- [ ] Database auto-initializes on first run
- [ ] Run `npm install` (already done)
- [ ] Run `npm run dev` to start server
- [ ] Open http://localhost:3000 in browser
- [ ] Test by creating a property in CMS
- [ ] View property in the listing page

## 📋 Key Files to Modify/Reference

1. **For Styling**: Edit `app/globals.css` or individual component styles
2. **For Database**: Modify `lib/db.ts` for connection settings
3. **For Types**: Update `lib/types.ts` for new property fields
4. **For API Logic**: Edit `app/api/properties/route.ts`
5. **For UI**: Update component files in `components/`

## 🔗 Quick Links to Files

| Purpose | File |
|---------|------|
| Database Connection | `lib/db.ts` |
| Data Types | `lib/types.ts` |
| Database Schema | `database/schema.sql` |
| Environment Setup | `.env.local` |
| Home Page | `app/page.tsx` |
| Property List | `app/properties/page.tsx` |
| Property Detail | `app/properties/[id]/page.tsx` |
| CMS Dashboard | `app/cms/page.tsx` |
| Edit Property | `app/cms/[id]/page.tsx` |
| API - List & Create | `app/api/properties/route.ts` |
| API - Detail, Update, Delete | `app/api/properties/[id]/route.ts` |

## 📖 Documentation Priority

1. Start with **QUICK_START.md** for setup
2. Read **README.md** for full documentation
3. Check **PROJECT_SUMMARY.md** for overview
4. Reference **FILE_MANIFEST.md** (this file) for file locations

---

Last Updated: June 18, 2026
Status: ✅ Complete and Ready for Use

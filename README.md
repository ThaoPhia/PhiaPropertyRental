# PhiaPropertyRental - Next.js Real Estate Management Application

A modern Next.js application for managing and displaying properties (apartments and duplexes) with a comprehensive CMS interface, SQLite data, and Supabase Storage-backed persistence.

## Features

- 🏠 **Property Listing**: Display all properties with detailed information 
- 📝 **CMS Management**: Create, read, update, and delete properties
- 🖼️ **Property Galleries**: Upload and browse multiple images per property
- 🔐 **CMS Authentication**: Admin-only CMS login with cookie sessions
- 🗄️ **SQLite Database**: File-based schema with optional cloud file persistence
- ☁️ **Supabase Storage**: Cloud storage for the SQLite DB file and property images
- 📱 **Responsive Design**: Beautiful UI with Tailwind CSS
- 🎯 **Property Details**: Comprehensive property pages with high-quality information
- 🚀 **Modern Stack**: Built with Next.js 16+, TypeScript, and React 19

## Tech Stack

- **Frontend**: Next.js 16+, React 19+, TypeScript
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

- `./database/phia-property-rental.db`

If the database is empty, the app creates the `properties` table and inserts sample data.

### 2. Environment Configuration

Create `.env` from the checked-in template in the project root, then replace
the placeholder admin password and reCAPTCHA keys with your own values:

```bash
cp -n .env.example .env
```

Next.js loads `.env` automatically. Keep it out of git. Environment-specific
files such as `.env.production` take precedence over `.env`, and variables
already set in the process take precedence over all environment files.
Restart the development server after changing environment variables.

Supabase DB object path is automatically derived from `SQLITE_DB_PATH`.

The admin login email is configured with `CMS_ADMIN_EMAIL`.

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Local Docker Development

With Docker Desktop running and `.env` configured, run `npm run docker:restart`
to build and start the development container, or rebuild and restart it if it
already exists. No separate down/up commands are needed. This applies environment
and dependency changes and refreshes only the dependency/build-cache volumes,
not the database or uploads. `docker:up` remains available with the same behavior. Use
`npm run docker:logs` for logs and `npm run docker:down` to stop it.

Use `SITE_URL=https://phiapropertyrental.test` without a port. A shared local
NGINX proxy owns `127.0.0.1:443` and routes TLS connections by hostname:

- `phiapropertyrental.test` goes to this app on container port 3000.
- `talentreferralplateform.test` goes to the Talent Referral Platform on container port 443.
- Unrecognized hostnames are rejected rather than sent to another app.

The proxy passes TLS through, so each app retains its own certificates and HTTPS
handling. Both apps join the external `local-https` Docker network.
`docker:restart` creates that network if needed and starts the proxy using
`docker/proxy/compose.yaml`. The other app must release host port 443 and use
`DOCKER_PROXY_NETWORK=local-https` in its environment before starting the proxy.

`SITE_PORT=444` is an optional direct-access/debugging host port, separate from
the browser-facing `SITE_URL`. It maps to container port 3000 and must not be 443.
Native `npm run dev` still serves HTTP on port 3000 by default; the shared HTTPS
routing described here is for Docker development.

Docker volume names come from a lowercase, hyphenated `SITE_NAME`: with
`SITE_NAME="Phia Rental LLC"`, they are `phia-rental-llc-node-modules` and
`phia-rental-llc-next-cache`. Use `npm run docker:down` before changing `SITE_NAME`
to remove the old cache volumes. No secrets are stored in the image.

Open `SITE_URL` after adding its hostname to your Mac's hosts file, or use
`https://localhost:444` for direct access. For HTTPS, the restart script
generates a self-signed certificate. This is a local development setup, not a
production image.

To use `phiapropertyrental.test`, add the local hostname mapping on macOS:

```bash
echo '127.0.0.1 phiapropertyrental.test' | sudo tee -a /etc/hosts
```

Use the hostname configured in `SITE_URL` in the hosts entry, then open
`SITE_URL` in your browser. The `.test` hostname is local to your Mac, not a
public domain. If using Google reCAPTCHA, add the hostname to the allowed
domains for your development site key.

For local HTTPS, Docker generates and reuses a self-signed certificate in the
ignored `certificates/` folder. To trust it on macOS (administrator approval
required), run:

```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain certificates/docker-local.pem
```

Restart your browser if needed, then open `SITE_URL`. Trust only the certificate,
not the private key; never share the private key. Without this step, the browser
will show a certificate warning. To use plain HTTP instead, set
up a separate HTTP routing configuration; the shared proxy only supports HTTPS.

The proxy has its own Compose project and stays running when `docker:down`
stops this app, so the other app remains accessible. To stop the shared proxy
explicitly (interrupting both domains), run:

```bash
docker compose -f docker/proxy/compose.yaml down
```

To add another app, connect it to `local-https` and add its hostname and container
address to `docker/proxy/nginx.conf`, then restart only the proxy:

```bash
docker compose -f docker/proxy/compose.yaml restart proxy
```

Docker keeps the database and uploads in the project folder. Existing Supabase
settings still apply, so local Docker uses the same configured cloud storage
and is not an isolated copy of your data.

Docker also starts Mailpit at http://localhost:8025. All app emails are captured
in this local inbox, not delivered to real recipients. The app uses Mailpit's
HTTP send API (`MAILPIT_URL=http://mailpit:8025` inside Docker); no SMTP library or
Resend API key is needed locally. Keep `SITE_EMAIL_FROM` and `SITE_EMAIL_TO` set
to valid email addresses. Mailpit's inbox is temporary and is cleared when the
container is recreated. Outside Docker, email continues to use Resend unless
you set `MAILPIT_URL=http://localhost:8025` for native development. Never set
`MAILPIT_URL` in production; the app rejects it outside development.

## Project Structure

```
PhiaPropertyRental/
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
│   │   ├── login/page.tsx        # Public CMS login page
│   │   └── (protected)/          # Admin-only CMS route group
│   │       ├── layout.tsx        # Shared admin authentication guard
│   │       ├── page.tsx          # CMS dashboard
│   │       ├── applications/     # Application management pages
│   │       ├── create/page.tsx   # Create property page
│   │       ├── manual-applicant/ # Create an application manually
│   │       ├── profile/page.tsx  # Admin profile page
│   │       └── [id]/             # Edit property page
│   ├── properties/
│   │   ├── page.tsx              # Property listing page
│   │   └── [id]/
│   │       └── page.tsx          # Property detail page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── cms/                      # CMS-only forms and application panels
│   ├── PropertyCard.tsx          # Public property card component
│   ├── ApplyNowForm.tsx          # Public application form
│   └── SiteFooter.tsx             # Shared site footer
├── lib/
│   ├── db.ts                     # SQLite database initialization
│   ├── auth.ts                   # Session/cookie auth helpers
│   └── password.ts               # Password hashing/verification
│   └── types/
│       ├── types.ts              # Shared domain interfaces and enums
│       └── apiTypes.ts           # Application API payload and record types
├── database/
│   └── schema.sql                # Database schema
├── public/                       # Static assets
├── .env                          # Environment variables
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
bathrooms=1.5
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
  "email": "admin@example.com",
  "password": "your-cms-admin-password",
  "recaptchaToken": "token-from-google-recaptcha"
}
```

### Application API Access

The following endpoints require a valid CMS session belonging to a user with
the `admin` role. Missing, invalid, expired, and non-admin sessions return
`401` with `{ "error": "Unauthorized" }`:

- `GET /api/applications` (applicant personal and financial data)
- `POST /api/applications/approve`
- `POST /api/applications/decline`
- `POST /api/applications/status` (pending, delete, and restore actions)
- `POST /api/applications/manual`

`POST /api/applications` remains public for renter submissions and requires
validation and reCAPTCHA. Public property reads and contact submissions remain
public; CMS page protection does not replace these API-level checks.

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
  zip_code TEXT NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms REAL NOT NULL,
  square_feet INTEGER NOT NULL,
  monthly_rent REAL NOT NULL,
  details TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE property_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
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
2. Sign in with your `CMS_ADMIN_EMAIL` and `CMS_ADMIN_PASSWORD`
3. **Dashboard**: View property and application summaries at `/cms`
4. **Create**: Use `/cms/create` to add a new listing
5. **Read and update**: View properties at `/properties` and edit them from `/cms/[id]`
6. **Applications**: Review and manage renter applications at `/cms/applications`
7. **Manual applicant**: Create an application directly from `/cms/manual-applicant`
8. **Profile**: Update the admin account at `/cms/profile`

All CMS pages except `/cms/login` require a valid admin session. The `(protected)` folder is a Next.js route group and is not included in the URLs.

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
npx tsc --noEmit
```

## Common Issues

### Database Connection Failed
- Check `SQLITE_DB_PATH` in `.env`
- Ensure the `database/` folder is writable
- Delete `database/phia-property-rental.db` to force a fresh re-initialization

### Image Not Displaying
- Verify `SUPABASE_STORAGE_IMAGE_BUCKET` is public
- Check Next.js image remote patterns in `next.config.ts`
- Verify image URL exists under your configured bucket/prefix

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

- [ ] Tests
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
- Keep `.env` out of git and configure `SQLITE_DB_PATH` per environment
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

This project is proprietary to PhiaPropertyRental.

## Support

For issues or questions, please contact the development team.

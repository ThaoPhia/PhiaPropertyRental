# Quick Start Guide - PhiaPropertyRental

Follow these steps to get your application up and running quickly.

## Step 1: Install Dependencies

```bash
cd /Users/phiathao/Code/Phia/NextJS/PhiaPropertyRental
npm install
```

## Step 2: Setup SQLite Database

SQLite is file-based. The app will auto-create `database/phia-property-rental.db` and initialize schema/sample data on first run.

Optional: if you want to start fresh later, delete the DB file:

```bash
rm -f database/phia-property-rental.db
```

## Step 3: Configure Environment Variables

Edit `.env` with your SQLite path and CMS admin credentials:

```env
SQLITE_DB_PATH=./database/phia-property-rental.db
SITE_NAME="Phia Rental LLC"
SITE_PORT=3000
SITE_URL=https://phiapropertyrental.test:${SITE_PORT}
NEXT_PUBLIC_API_URL=${SITE_URL}
CMS_ADMIN_EMAIL=admin@example.com
CMS_ADMIN_PASSWORD=replace-with-a-strong-password
```

## Step 4: Start the Application

```bash
npm run dev
```

The application will start at `http://localhost:3000`

## Step 5: Access the Application

- **Home Page**: http://localhost:3000
- **Browse Properties**: http://localhost:3000/properties
- **CMS Login**: http://localhost:3000/cms/login
- **CMS Dashboard**: http://localhost:3000/cms (requires login)
- **Admin Email**: Your configured `CMS_ADMIN_EMAIL`

## Run Locally with Docker

Install and start Docker Desktop, and create the root `.env` as described above.
Then run:

```bash
npm run docker:restart
```

This command creates the container if missing, or rebuilds and restarts it if
already present. No manual down/up sequence is needed; `docker:up` remains an
equivalent command. The script builds the development image and waits for
the app's HTTP health check. Open `SITE_URL` (after the hosts setup below), or
`localhost:<SITE_PORT>` with the same HTTP/HTTPS protocol. Source changes reload
automatically; rerun the command after changing dependencies or `.env`.
The port configured by `SITE_PORT` must be free before starting. Docker maps it
to the container's internal port 3000. `SITE_URL` must be an HTTP or HTTPS origin with
that same port; references such as `${SITE_PORT}` in `.env` expand automatically.
Native `npm run dev` still defaults to port 3000; use
`npm run dev -- --port <SITE_PORT>` for a different port outside Docker.

Docker derives volume names from `SITE_NAME`, lowercasing it and replacing spaces
and punctuation with hyphens. For `SITE_NAME="Phia Rental LLC"`, the volumes are
`phia-rental-llc-node-modules` and `phia-rental-llc-next-cache`.
Each `docker:restart` (or `docker:up`) rebuilds the image, stops the existing app, and recreates these
volumes so dependencies stay in sync with the lockfile. It does not delete the
database or uploads, which live in the project folder.
Run `npm run docker:down` before changing `SITE_NAME` to remove the old volumes.
Use the npm Docker commands rather than raw `docker compose up`: the script
validates the site settings and supplies the normalized volume name.

The container uses Node.js 24 and installs Linux dependencies separately from
your Mac's `node_modules`. `.env` is loaded at runtime, not copied into the image.
The database remains in `database/phia-property-rental.db` and local uploads
remain in `public/images/properties` on your Mac. Existing Supabase settings
still apply, so this is not an isolated copy of your data or cloud services.
Docker overrides `SQLITE_DB_PATH` to that persistent database path and
`NEXT_PUBLIC_API_URL` to `SITE_URL`.

### Use phiaPropertyRental.test

Docker does not require the browser address to be `localhost`. Domain names are
case-insensitive, so `phiaPropertyRental.test` and `phiapropertyrental.test` are
the same hostname.

Add the local mapping once from your Mac's terminal (administrator password
required):

```bash
echo '127.0.0.1 phiapropertyrental.test' | sudo tee -a /etc/hosts
```

Then open the configured `SITE_URL`. Use the hostname from `SITE_URL` in the
hosts entry if you change it. This mapping is local to your Mac,
not a public domain. Include `SITE_PORT` in the URL. Next.js allows this
development origin for hot reload. If using Google reCAPTCHA, add
`phiapropertyrental.test` to the allowed domains for your development site key.

### Local HTTPS

When `SITE_URL` uses `https://`, `docker:restart` automatically generates a
self-signed certificate for that hostname, `localhost`, and `127.0.0.1` using
OpenSSL. It reuses the certificate until the hostname changes or expiry approaches.
Certificates expire after 30 days; regenerated certificates must be trusted again.
The private key and certificate stay in the ignored `certificates/` folder and
are never copied into the Docker image. Next.js uses its experimental development
HTTPS server; the health check verifies TLS using the generated certificate.

To trust the certificate on macOS, run this in your terminal (administrator
approval required):

```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain certificates/docker-local.pem
```

Restart your browser if needed, then open `SITE_URL`. Trust only the certificate,
not the private key, and never share the private key. Without this trust step,
the browser will show a certificate warning. To use plain HTTP instead, set
`SITE_URL=http://phiapropertyrental.test:${SITE_PORT}` and run `docker:restart`.

This setup uses development mode; it is not a production deployment.

### Local Email Inbox (Mailpit)

Open http://localhost:8025 to view contact requests and application notification
emails. Docker routes all app email to Mailpit's HTTP API; nothing is delivered
to real inboxes, and no Resend API key is required. Configure valid
`SITE_EMAIL_FROM` and `SITE_EMAIL_TO` addresses in `.env`.
Mailpit messages are temporary and cleared when its container is recreated.
Native development can use the same inbox with
`MAILPIT_URL=http://localhost:8025`; leave this variable unset in production
to retain Resend delivery.

### Logs and Shutdown

```bash
npm run docker:logs
npm run docker:down
```

Shutdown removes the container's dependency/build-cache volumes, not your
database, uploads, or source files. The next startup recreates those volumes.

## Troubleshooting

### SQLite Database Issues

**Solution**:
1. Check `.env` has a valid `SQLITE_DB_PATH`
2. Ensure the `database` directory exists and is writable
3. Reset the DB file: `rm -f database/phia-property-rental.db`

### Port 3000 is Already in Use

**Solution**:
```bash
# Run on a different port
npm run dev -- -p 3001
```

### Database Schema Not Applied

**Solution**:
```bash
# Reset and let app auto-initialize
rm -f database/phia-property-rental.db
npm run dev
```

## Features to Try

1. **View Properties**: Browse existing properties with details
2. **Filter**: Filter by property type and city
3. **Create Property**: Add a new property via CMS with multiple images
4. **Edit Property**: Modify existing property details, append images, or remove existing ones
5. **Delete Property**: Remove a property from the system
6. **Property Details**: View complete information for any property

## Next Steps

1. Customize the styling in `app/globals.css`
2. Add more property images to `/public/images/properties/`
3. Add additional admin users if needed
4. Add additional property fields as needed
5. Deploy to Vercel or your preferred hosting

## File Locations

- **API Routes**: `app/api/properties/`
- **Components**: `components/`
- **Pages**: `app/` (with route-based structure)
- **Database**: `lib/db.ts` and `database/schema.sql`
- **Types**: `lib/types/types.ts` and `lib/types/apiTypes.ts`
- **Environment**: `.env`

## Production Deployment

See the README.md for detailed deployment instructions for Vercel and self-hosted options.

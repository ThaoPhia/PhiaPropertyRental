# Quick Start Guide - PhiaRentalLLC

Follow these steps to get your application up and running quickly.

## Step 1: Install Dependencies

```bash
cd /Users/phiathao/Code/Phia/NextJS/PhiaRentalLLC
npm install
```

## Step 2: Setup SQLite Database

SQLite is file-based. The app will auto-create `database/phiarentalllc.db` and initialize schema/sample data on first run.

Optional: if you want to start fresh later, delete the DB file:

```bash
rm -f database/phiarentalllc.db
```

## Step 3: Configure Environment Variables

Edit `.env.local` with your SQLite path:

```env
SQLITE_DB_PATH=./database/phiarentalllc.db
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Step 4: Start the Application

```bash
npm run dev
```

The application will start at `http://localhost:3000`

## Step 5: Access the Application

- **Home Page**: http://localhost:3000
- **Browse Properties**: http://localhost:3000/properties
- **CMS Dashboard**: http://localhost:3000/cms
- **Add New Property**: http://localhost:3000/cms

## Troubleshooting

### SQLite Database Issues

**Solution**:
1. Check `.env.local` has a valid `SQLITE_DB_PATH`
2. Ensure the `database` directory exists and is writable
3. Reset the DB file: `rm -f database/phiarentalllc.db`

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
rm -f database/phiarentalllc.db
npm run dev
```

## Features to Try

1. **View Properties**: Browse existing properties with details
2. **Filter**: Filter by property type and city
3. **Create Property**: Add a new property via CMS
4. **Edit Property**: Modify existing property details
5. **Delete Property**: Remove a property from the system
6. **Property Details**: View complete information for any property

## Next Steps

1. Customize the styling in `app/globals.css`
2. Add more property images to `/public/images/`
3. Implement authentication for CMS access
4. Add additional property fields as needed
5. Deploy to Vercel or your preferred hosting

## File Locations

- **API Routes**: `app/api/properties/`
- **Components**: `components/`
- **Pages**: `app/` (with route-based structure)
- **Database**: `lib/db.ts` and `database/schema.sql`
- **Types**: `lib/types.ts`
- **Environment**: `.env.local`

## Production Deployment

See the README.md for detailed deployment instructions for Vercel and self-hosted options.


# Database Setup Guide

This directory contains database initialization scripts and documentation for the Dorm Deals Network marketplace application.

## Files

- `init.sql` - Pure SQL script for database initialization
- `init.js` - Node.js script for programmatic database setup
- `README.md` - This file

## Quick Setup

### Option 1: Automatic (via Node.js script)

```bash
# Ensure you have the required environment variables set
export DATABASE_URL="postgresql://username:password@localhost:5432/marketplace_db"

# Run the initialization script
cd server
node database/init.js
```

### Option 2: Manual (via SQL file)

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run the SQL script
\i database/init.sql
```

### Option 3: Application Auto-Setup

The application will automatically create missing tables when it starts. The base tables (users, universities) will be created and seeded with university data.

## What Gets Created

### Tables
1. **universities** - University information and email domains
2. **users** - User accounts and authentication
3. **items** - Marketplace listings
4. **saved_items** - User bookmarked items
5. **messages** - Direct messaging system
6. **study_groups** - Study group information
7. **study_group_members** - Study group memberships

### Indexes
- Primary key indexes (automatic)
- Foreign key indexes (automatic)
- Performance indexes on frequently queried columns
- Composite indexes for complex queries

### Seed Data
- 50+ major US universities with their .edu domains
- Includes Ivy League, top tech schools, major state universities
- Test university for development

## Environment Variables

Make sure these are set before running the initialization:

```bash
DATABASE_URL=postgresql://username:password@host:port/database_name
NODE_ENV=development  # or production
```

## Verification

After running the initialization, you can verify the setup:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check university count
SELECT COUNT(*) FROM universities;

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';
```

## Maintenance

### Adding New Universities

To add new universities, either:

1. Insert directly into the database:
```sql
INSERT INTO universities (name, domain) VALUES 
('New University', 'newu.edu');
```

2. Add to the UNIVERSITIES array in `init.js` and re-run the script

### Database Migrations

The application includes automatic migration functions that:
- Add missing columns to existing tables
- Create new tables as features are added
- Maintain backward compatibility

### Backup and Restore

```bash
# Create backup
pg_dump $DATABASE_URL > backup.sql

# Restore backup
psql $DATABASE_URL < backup.sql
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Check if PostgreSQL is running
2. **Permission denied**: Ensure user has CREATE privileges
3. **Table already exists**: Safe to ignore, tables use IF NOT EXISTS
4. **Foreign key constraint**: Ensure parent tables are created first

### Reset Database

To completely reset the database:

```sql
-- Drop all tables (careful!)
DROP TABLE IF EXISTS study_group_members CASCADE;
DROP TABLE IF EXISTS study_groups CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS saved_items CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS universities CASCADE;

-- Then re-run initialization
```

### Check Logs

The Node.js initialization script provides detailed logging:
- ✓ for successful operations
- ⚠ for warnings
- ❌ for errors

## Production Considerations

### Security
- Use strong passwords for database users
- Limit database user permissions
- Use SSL connections in production
- Regular security updates

### Performance
- Monitor query performance
- Consider additional indexes for large datasets
- Regular VACUUM and ANALYZE operations
- Monitor table sizes and growth

### Backup Strategy
- Regular automated backups
- Test restore procedures
- Store backups securely
- Document recovery procedures

## Development vs Production

### Development
- Uses local PostgreSQL instance
- Includes test university
- More detailed logging
- Sample data can be added for testing

### Production
- Uses hosted PostgreSQL (Heroku Postgres, etc.)
- SSL connections required
- Environment-specific configurations
- No test data included

## Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your DATABASE_URL is correctly formatted
3. Ensure PostgreSQL is running and accessible
4. Check that the database user has necessary permissions

For more information, see the main project documentation.

# Database Schema

## Overview

This document describes the PostgreSQL database schema for the Dorm Deals Network marketplace application. The database uses PostgreSQL with automatic table creation and migration scripts.

## Database Connection

- **Database Type**: PostgreSQL
- **Connection**: Uses `pg` driver with connection pooling
- **Environment Variable**: `DATABASE_URL`

## Tables

### 1. users
Stores user account information and authentication data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing user ID |
| name | VARCHAR(255) | NOT NULL | User's full name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | .edu email address |
| password | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| university_id | INTEGER | REFERENCES universities(id) | Foreign key to user's university |
| profile_image_url | VARCHAR(255) | NULL | Cloudinary image URL |
| refresh_token | TEXT | NULL | JWT refresh token for authentication |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last profile update timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `email`

### 2. universities
Contains university information for email domain verification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing university ID |
| name | VARCHAR(255) | NOT NULL | Full university name |
| domain | VARCHAR(100) | NOT NULL, UNIQUE | Email domain (e.g., "harvard.edu") |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `domain`

### 3. items
Marketplace listings created by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing item ID |
| title | VARCHAR(255) | NOT NULL | Item title/name |
| description | TEXT | NOT NULL | Detailed item description |
| category | VARCHAR(100) | NOT NULL | Item category (textbooks, electronics, etc.) |
| price | DECIMAL(10,2) | NOT NULL | Item price in USD |
| condition | VARCHAR(50) | NOT NULL | Item condition (new, like new, good, fair, poor) |
| contact_method | VARCHAR(50) | DEFAULT 'email' | Preferred contact method |
| contact_info | VARCHAR(255) | NULL | Contact information (email/phone) |
| user_id | INTEGER | REFERENCES users(id) | Foreign key to item owner |
| status | VARCHAR(20) | DEFAULT 'active' | Item status (active, sold, deleted) |
| image_url | VARCHAR(255) | NULL | Cloudinary image URL |
| views | INTEGER | DEFAULT 0 | Number of times item was viewed |
| created_at | TIMESTAMP | DEFAULT NOW() | Item creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last item update timestamp |

**Indexes:**
- Primary key on `id`
- Foreign key index on `user_id`
- Index on `status` for filtering active items
- Index on `category` for category filtering

### 4. saved_items
User's bookmarked/saved items for later reference.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing save ID |
| user_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | User who saved the item |
| item_id | INTEGER | REFERENCES items(id) ON DELETE CASCADE | Saved item reference |
| created_at | TIMESTAMP | DEFAULT NOW() | Save timestamp |

**Constraints:**
- UNIQUE(user_id, item_id) - Prevents duplicate saves

**Indexes:**
- Primary key on `id`
- Unique composite index on `(user_id, item_id)`
- Foreign key indexes on `user_id` and `item_id`

### 5. messages
Direct messaging system between users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing message ID |
| sender_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | Message sender |
| receiver_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | Message recipient |
| item_id | INTEGER | REFERENCES items(id) ON DELETE SET NULL | Related item (optional) |
| content | TEXT | NOT NULL | Message content |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| created_at | TIMESTAMP | DEFAULT NOW() | Message timestamp |

**Indexes:**
- Primary key on `id`
- Foreign key indexes on `sender_id`, `receiver_id`, `item_id`
- Composite index on `(receiver_id, is_read)` for unread message queries
- Composite index on `(sender_id, receiver_id)` for conversation queries

### 6. study_groups
Study groups created by students for collaboration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing group ID |
| name | VARCHAR(255) | NOT NULL | Study group name |
| subject | VARCHAR(100) | NOT NULL | Subject/course name |
| description | TEXT | NULL | Group description and purpose |
| location | VARCHAR(255) | NULL | Meeting location |
| max_members | INTEGER | DEFAULT 8 | Maximum number of members |
| schedule | VARCHAR(255) | NULL | Meeting schedule/times |
| created_by | INTEGER | REFERENCES users(id) ON DELETE CASCADE | Group creator |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Group creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Foreign key index on `created_by`
- Index on `subject` for subject-based filtering
- Index on `is_active` for filtering active groups

### 7. study_group_members
Members of study groups (many-to-many relationship).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing membership ID |
| group_id | INTEGER | REFERENCES study_groups(id) ON DELETE CASCADE | Study group reference |
| user_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | Member user reference |
| joined_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Join timestamp |

**Constraints:**
- UNIQUE(group_id, user_id) - Prevents duplicate memberships

**Indexes:**
- Primary key on `id`
- Unique composite index on `(group_id, user_id)`
- Foreign key indexes on `group_id` and `user_id`

## Relationships

### One-to-Many Relationships
- **universities** → **users**: One university has many users
- **users** → **items**: One user can create many items
- **users** → **messages** (as sender): One user can send many messages
- **users** → **messages** (as receiver): One user can receive many messages
- **users** → **study_groups**: One user can create many study groups
- **items** → **messages**: One item can have many related messages

### Many-to-Many Relationships
- **users** ↔ **items** (via saved_items): Users can save multiple items, items can be saved by multiple users
- **users** ↔ **study_groups** (via study_group_members): Users can join multiple groups, groups can have multiple members

### Optional Relationships
- **items** → **messages**: Messages can optionally relate to specific items
- **users** → **universities**: Users should have a university but foreign key allows NULL

## Data Types and Constraints

### String Lengths
- **Short identifiers**: VARCHAR(50-100) for categories, conditions, contact methods
- **Names and titles**: VARCHAR(255) for names, titles, locations
- **Long content**: TEXT for descriptions, message content
- **URLs**: VARCHAR(255) for image URLs (Cloudinary URLs)

### Timestamps
- All tables use `TIMESTAMP` with `DEFAULT NOW()` or `DEFAULT CURRENT_TIMESTAMP`
- PostgreSQL automatically handles timezone conversion

### Referential Integrity
- Foreign keys use appropriate CASCADE or SET NULL behaviors
- UNIQUE constraints prevent data duplication where needed

## Database Migrations

The application implements automatic database migrations through functions in `server/index.js`:

### Migration Functions
- `ensureImageColumn()` - Adds image_url to items table
- `ensureRefreshTokenColumn()` - Adds refresh_token to users table  
- `ensureViewsColumn()` - Adds views counter to items table
- `ensureSavedItemsTable()` - Creates saved_items table
- `ensureMessagesTable()` - Creates messages table
- `ensureStudyGroupsTables()` - Creates study groups and members tables

### Auto-Creation
- **items** table is auto-created if missing during first item post
- **study_groups** and **study_group_members** tables are auto-created during first study group creation

## Sample Data Requirements

### Required Seed Data
The application requires pre-populated university data:

```sql
INSERT INTO universities (name, domain) VALUES
('Harvard University', 'harvard.edu'),
('Stanford University', 'stanford.edu'),
('Massachusetts Institute of Technology', 'mit.edu'),
-- Add more universities as needed
```

### Categories
Categories are stored as VARCHAR values, common categories include:
- 'textbooks'
- 'electronics' 
- 'furniture'
- 'clothing'
- 'sports'
- 'other'

## Performance Considerations

### Indexes
- Primary keys automatically indexed
- Foreign keys automatically indexed
- Additional indexes on frequently queried columns (status, category, subject)
- Composite indexes for complex queries (user_id + item_id, receiver_id + is_read)

### Query Optimization
- Use of LIMIT for pagination
- Efficient JOIN operations for related data
- Proper WHERE clause indexing

## Security Considerations

### Data Protection
- Passwords stored using BCrypt hashing
- JWT tokens stored temporarily in refresh_token column
- CASCADE deletes ensure data cleanup
- Email uniqueness enforced at database level

### Access Control
- All sensitive operations require JWT authentication
- User can only modify their own data (enforced at application level)
- Soft deletes available through status fields where needed

## Backup and Maintenance

### Recommended Practices
- Regular database backups before schema changes
- Monitor table sizes, especially messages and saved_items
- Periodic cleanup of expired refresh tokens
- Archive old messages if storage becomes an issue

---

**Last Updated**: July 20, 2025  
**Database Version**: PostgreSQL 12+  
**Application Version**: 1.0.0
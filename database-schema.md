# Database Schema

## Tables

### Users
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(100) | User's full name |
| email | VARCHAR(100) | .edu email address |
| password | VARCHAR(255) | Hashed password |
| university_id | INT | Foreign key to Universities |
| is_verified | BOOLEAN | Email verification status |
| created_at | TIMESTAMP | Account creation date |

### Universities
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(100) | University name |
| domain | VARCHAR(50) | Email domain (e.g., "harvard.edu") |

### Items
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| user_id | INT | Foreign key to Users |
| title | VARCHAR(100) | Item title |
| description | TEXT | Detailed description |
| price | DECIMAL(10,2) | Item price |
| category_id | INT | Foreign key to Categories |
| status | ENUM | Available, Sold, Expired |
| expiration_date | DATE | Semester end date |
| created_at | TIMESTAMP | Listing date |

### Categories
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(50) | Category name |
| university_id | INT | Null for global categories |

### StudyGroups
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| course_code | VARCHAR(20) | e.g., "CS101" |
| description | TEXT | Group purpose |
| meeting_times | TEXT | When group meets |
| creator_id | INT | Foreign key to Users |

## Relationships
- One University has many Users
- One User has many Items
- One Category has many Items
- One University has many Categories
- One User can create many StudyGroups
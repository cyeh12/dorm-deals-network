-- ============================================
-- DATABASE INITIALIZATION SCRIPT
-- Dorm Deals Network Marketplace
-- ============================================

-- Create universities table
CREATE TABLE IF NOT EXISTS universities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    university_id INTEGER REFERENCES universities(id),
    profile_image_url VARCHAR(255),
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    contact_method VARCHAR(50) DEFAULT 'email',
    contact_info VARCHAR(255),
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    image_url VARCHAR(255),
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create saved_items table
CREATE TABLE IF NOT EXISTS saved_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create study_groups table
CREATE TABLE IF NOT EXISTS study_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    max_members INTEGER DEFAULT 8,
    schedule VARCHAR(255),
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create study_group_members table
CREATE TABLE IF NOT EXISTS study_group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_university_id ON users(university_id);

-- Universities indexes
CREATE INDEX IF NOT EXISTS idx_universities_domain ON universities(domain);

-- Items indexes
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);

-- Saved items indexes
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_item_id ON saved_items(item_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_item_id ON messages(item_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);

-- Study groups indexes
CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON study_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_study_groups_subject ON study_groups(subject);
CREATE INDEX IF NOT EXISTS idx_study_groups_active ON study_groups(is_active);

-- Study group members indexes
CREATE INDEX IF NOT EXISTS idx_study_group_members_group_id ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user_id ON study_group_members(user_id);

-- ============================================
-- SEED DATA - UNIVERSITIES
-- ============================================

INSERT INTO universities (name, domain) VALUES
-- Ivy League
('Harvard University', 'harvard.edu'),
('Yale University', 'yale.edu'),
('Princeton University', 'princeton.edu'),
('Columbia University', 'columbia.edu'),
('University of Pennsylvania', 'upenn.edu'),
('Dartmouth College', 'dartmouth.edu'),
('Brown University', 'brown.edu'),
('Cornell University', 'cornell.edu'),

-- Top Tech Universities
('Massachusetts Institute of Technology', 'mit.edu'),
('Stanford University', 'stanford.edu'),
('California Institute of Technology', 'caltech.edu'),
('Carnegie Mellon University', 'cmu.edu'),
('Georgia Institute of Technology', 'gatech.edu'),

-- Major State Universities
('University of California, Berkeley', 'berkeley.edu'),
('University of California, Los Angeles', 'ucla.edu'),
('University of California, San Diego', 'ucsd.edu'),
('University of Michigan', 'umich.edu'),
('University of Illinois Urbana-Champaign', 'illinois.edu'),
('University of Washington', 'uw.edu'),
('University of Texas at Austin', 'utexas.edu'),
('University of Wisconsin-Madison', 'wisc.edu'),
('Pennsylvania State University', 'psu.edu'),
('Ohio State University', 'osu.edu'),
('University of Florida', 'ufl.edu'),
('University of Georgia', 'uga.edu'),
('University of North Carolina at Chapel Hill', 'unc.edu'),
('University of Virginia', 'virginia.edu'),

-- Other Notable Universities
('Duke University', 'duke.edu'),
('Northwestern University', 'northwestern.edu'),
('University of Chicago', 'uchicago.edu'),
('Vanderbilt University', 'vanderbilt.edu'),
('Rice University', 'rice.edu'),
('Johns Hopkins University', 'jhu.edu'),
('Washington University in St. Louis', 'wustl.edu'),
('University of Notre Dame', 'nd.edu'),
('Georgetown University', 'georgetown.edu'),
('University of Southern California', 'usc.edu'),
('New York University', 'nyu.edu'),
('Boston University', 'bu.edu'),
('Northeastern University', 'northeastern.edu'),

-- California State Universities
('San Diego State University', 'sdsu.edu'),
('California State University, Long Beach', 'csulb.edu'),
('San Francisco State University', 'sfsu.edu'),
('California State University, Fullerton', 'fullerton.edu'),

-- Additional Major Universities
('Arizona State University', 'asu.edu'),
('University of Arizona', 'arizona.edu'),
('University of Colorado Boulder', 'colorado.edu'),
('University of Oregon', 'uoregon.edu'),
('Oregon State University', 'oregonstate.edu'),
('University of Utah', 'utah.edu'),
('University of Nevada, Las Vegas', 'unlv.edu'),

-- Test University for development
('Test University', 'test.edu')

ON CONFLICT (domain) DO NOTHING;

-- ============================================
-- SAMPLE DATA (Optional - for development)
-- ============================================

-- Note: Uncomment the sections below if you want sample data for development

/*
-- Sample users (passwords are hashed for 'password123')
INSERT INTO users (name, email, password, university_id) VALUES
('John Doe', 'john.doe@harvard.edu', '$2b$10$rOFWz8rO8mKVVGGQQGGQGuO6xCNYVVeJKKKmzqKNNKKmzqKNNKKmz', 1),
('Jane Smith', 'jane.smith@mit.edu', '$2b$10$rOFWz8rO8mKVVGGQQGGQGuO6xCNYVVeJKKKmzqKNNKKmzqKNNKKmz', 9),
('Mike Johnson', 'mike.johnson@stanford.edu', '$2b$10$rOFWz8rO8mKVVGGQQGGQGuO6xCNYVVeJKKKmzqKNNKKmzqKNNKKmz', 10)
ON CONFLICT (email) DO NOTHING;

-- Sample items
INSERT INTO items (title, description, category, price, condition, user_id, status) VALUES
('Calculus Textbook', 'Stewart Calculus 8th Edition, excellent condition', 'textbooks', 89.99, 'like new', 1, 'active'),
('MacBook Pro 2021', '13-inch MacBook Pro with M1 chip, lightly used', 'electronics', 1299.99, 'good', 2, 'active'),
('Desk Lamp', 'IKEA desk lamp, perfect for studying', 'furniture', 19.99, 'good', 3, 'active')
ON CONFLICT DO NOTHING;

-- Sample study groups
INSERT INTO study_groups (name, subject, description, created_by, location) VALUES
('CS50 Study Group', 'Computer Science', 'Weekly study sessions for Harvard CS50', 1, 'Harvard Library'),
('Calculus Help', 'Mathematics', 'Group tutoring for Calculus I and II', 2, 'MIT Student Center'),
('Physics Problem Solving', 'Physics', 'Collaborative problem solving sessions', 3, 'Stanford Physics Building')
ON CONFLICT DO NOTHING;
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table creation
SELECT 
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'universities', 'items', 'saved_items', 'messages', 'study_groups', 'study_group_members')
ORDER BY table_name;

-- Check university count
SELECT COUNT(*) as university_count FROM universities;

-- Show all created tables and their row counts
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
    AND tablename IN ('users', 'universities', 'items', 'saved_items', 'messages', 'study_groups', 'study_group_members')
ORDER BY tablename, attname;

# User Requirements Documentation

## User Roles

1. **Guest User** (Unauthenticated)
2. **Student User** (Authenticated with .edu email)
3. **Admin User** (Platform management - future feature)

## User Stories

### Authentication & Security
1. As a student, I want to register with my .edu email so that I can prove I'm a student
2. As a user, I want to log in to my account so that I can access marketplace features
3. As a user, I want secure JWT-based authentication so that my session is protected
4. As a user, I want automatic token refresh so that I don't get logged out unexpectedly
5. As a user, I want to log out securely so that my account is protected

### Profile Management
6. As a user, I want to upload a profile picture so that other users can recognize me
7. As a user, I want to view and edit my profile information
8. As a user, I want a personal dashboard to see my activity and statistics

### Marketplace Items
9. As a student, I want to list items for sale so that other students can buy them
10. As a student, I want to upload high-quality images for my listings
11. As a student, I want to browse items for sale so that I can find what I need
12. As a student, I want to search and filter items by category, university, and price so that I can find relevant items
13. As a student, I want to see detailed item information so that I can make informed purchasing decisions
14. As a seller, I want to mark items as sold/active so that buyers know availability status
15. As a seller, I want to edit my listings so that I can update prices or descriptions
16. As a seller, I want to delete my listings when items are no longer available
17. As a user, I want to see how many people have viewed my items
18. As a buyer, I want to save/bookmark items I'm interested in for later

### Communication
19. As a user, I want to send direct messages to sellers so that I can negotiate and arrange purchases
20. As a user, I want to see all my conversations in one place
21. As a user, I want to know when I have unread messages
22. As a user, I want to mark conversations as read
23. As a user, I want to contact sellers via email or phone based on their preferences

### Study Groups
24. As a student, I want to create study groups for my courses so that I can collaborate with others
25. As a student, I want to find and join existing study groups
26. As a student, I want to leave study groups if they're no longer relevant
27. As a study group creator, I want to set a maximum number of members
28. As a study group creator, I want to delete groups I created

### Search & Discovery
29. As a user, I want to filter items by multiple criteria (category, university, price range, condition)
30. As a user, I want to sort items by different criteria (newest, price, alphabetical)
31. As a user, I want to see items from my university prominently
32. As a user, I want to search by keywords in title and description

## Implemented Features Status

### ✅ **Fully Implemented**
- User registration with .edu email verification
- JWT-based authentication with refresh tokens
- Secure login/logout
- Item creation, editing, and deletion
- Image uploads via Cloudinary
- Advanced search and filtering
- Item browsing and detail views
- Profile picture management
- Personal dashboard
- Saved items functionality
- Direct messaging system
- Study groups (create, join, leave, delete)
- University-specific filtering
- Item view tracking

### 🚧 **Partially Implemented**
- Admin features (database structure exists, no UI)
- Email contact integration (basic implementation)

### ❌ **Not Implemented (Future Features)**
- Password reset functionality
- Automatic item expiration
- Admin content moderation interface
- Course notes specific marketplace
- Push notifications
- Advanced reporting/analytics

## Acceptance Criteria

### Authentication
- Users must register with valid .edu email addresses
- JWT tokens expire after 24 hours with automatic refresh
- Secure password hashing with BCrypt
- Protected routes require authentication

### Marketplace Items
- All items must have: title, description, price, category, and condition
- Images are optional but recommended
- Users can only edit/delete their own listings
- Items can be marked as active/sold
- Item views are tracked for analytics

### Search & Filtering
- Search functionality works by title and description
- Filtering available by: category, university, price range, condition
- Sorting options: newest, oldest, price (low/high), alphabetical
- University-specific filtering based on user's institution

### Communication
- Direct messaging between users
- Message read/unread status tracking
- Contact methods: email and phone support
- Message history preserved per conversation

### Study Groups
- Users can create groups with name, subject, description, location
- Maximum member limits configurable
- Group creators can delete their groups
- Users can join/leave groups freely

### Technical Requirements
- Responsive design for mobile and desktop
- Secure file uploads with Cloudinary
- PostgreSQL database with proper relationships
- RESTful API architecture
- Modern React frontend with Bootstrap UI
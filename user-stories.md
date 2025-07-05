# User Requirements Documentation

## User Roles

1. **Guest User** (Unauthenticated)
2. **Student User** (Authenticated with .edu email)
3. **Admin User** (Manages platform)

## User Stories

### Authentication
1. As a student, I want to register with my .edu email so that I can prove I'm a student
2. As a user, I want to log in to my account so that I can access marketplace features
3. As a user, I want to reset my password if I forget it

### Marketplace Items
4. As a student, I want to list items for sale so that other students can buy them
5. As a student, I want to browse items for sale so that I can find what I need
6. As a student, I want to search and filter items by category so that I can find relevant items
7. As a student, I want to see item details so that I can make informed purchasing decisions
8. As a seller, I want to mark items as sold so that buyers know they're no longer available
9. As a seller, I want to edit my listings so that I can update prices or descriptions

### Study Group/Notes
10. As a student, I want to find study groups for my courses so that I can collaborate
11. As a student, I want to buy/sell course notes so that I can supplement my learning

### Administration
12. As an admin, I want to remove inappropriate listings so that the platform stays safe
13. As an admin, I want to verify student emails so that only real students can use the platform

## Acceptance Criteria

- All marketplace items must have: title, description, price, category, images, and expiration date
- Users must verify .edu email before posting items
- Items automatically expire at semester end
- Users can only edit/delete their own listings
- Search functionality works by title, category, and price range
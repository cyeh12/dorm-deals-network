# Image Upload Feature Setup

## Overview
The image upload feature allows users to add photos to their marketplace listings. Images are stored in Cloudinary (cloud storage) and referenced in the database, keeping the database lightweight.

## Database Impact
- **Minimal**: Only adds one column (`image_url`) to the `items` table
- **Storage**: ~100-500 bytes per item (just the URL)
- **Performance**: No impact on database performance

## Setup Instructions

### 1. Cloudinary Account Setup
1. Go to [Cloudinary](https://cloudinary.com/) and create a free account
2. Get your credentials from the dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 2. Environment Variables
Create a `.env` file in the `/server` directory:

```bash
# Database
DATABASE_URL=your_database_url

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Environment
NODE_ENV=development
```

### 3. Database Migration
The `image_url` column is automatically added to the `items` table when the server starts. No manual migration needed.

### 4. Testing Locally
1. Start the server: `cd server && npm start`
2. Start the client: `cd server/client && npm run dev`
3. Go to http://localhost:5173 and test posting an item with an image

## Features Added

### Backend
- **Image Upload Endpoint**: `POST /api/upload-image`
- **Image Delete Endpoint**: `DELETE /api/delete-image/:publicId`
- **Updated Item Endpoints**: All item endpoints now include `image_url`
- **Automatic Resizing**: Images are automatically resized to 800x600 max
- **File Validation**: 5MB limit, supports JPEG, PNG, GIF, WebP

### Frontend
- **Post Item Page**: Image upload with preview
- **Item Detail Page**: Full-size image display
- **Browse Items Page**: Image thumbnails on item cards
- **Dashboard**: Small thumbnails in recent items

## File Structure
```
server/
├── index.js (updated with image upload routes)
├── package.json (added multer, cloudinary dependencies)
└── .env (new - add your Cloudinary credentials)

client/src/pages/
├── PostItemPage.jsx (updated with image upload)
├── ItemDetailPage.jsx (updated with image display)
├── BrowseItemsPage.jsx (updated with image thumbnails)
└── DashboardPage.jsx (updated with image thumbnails)
```

## Usage
1. **Posting Items**: Users can now upload an image when posting an item
2. **Viewing Items**: Images are displayed throughout the app
3. **Browsing**: Items with images show thumbnails in the browse page
4. **Dashboard**: Recent items show small thumbnails

## Production Deployment
For production (Heroku), add the Cloudinary environment variables:
```bash
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
heroku config:set CLOUDINARY_API_KEY=your_api_key
heroku config:set CLOUDINARY_API_SECRET=your_api_secret
```

## Error Handling
- Invalid file types are rejected with user-friendly messages
- Files over 5MB are rejected
- Images that fail to load are gracefully hidden
- Server errors are logged and return appropriate error messages

## Future Enhancements
- Multiple images per item
- Image compression optimization
- Image editing tools
- Drag & drop upload interface

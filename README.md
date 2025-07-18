# Dorm Deals Network

A comprehensive marketplace platform exclusively for university students to buy, sell, and trade textbooks, electronics, furniture, and other campus essentials. Connect with fellow students, discover great deals, and build a sustainable campus community.

## 🌟 Features

### Core Marketplace
- **Student Email Verification**: Exclusive access with .edu email addresses
- **University-Specific Trading**: Items filtered by your university
- **Comprehensive Categories**: Textbooks, Electronics, Furniture, Clothing, Sports & Recreation
- **Advanced Search & Filtering**: Filter by category, university, price range, and condition
- **Item Management**: Create, edit, update, and delete your listings
- **Image Uploads**: High-quality photo uploads with Cloudinary integration
- **Item Views Tracking**: See how many students have viewed your items

### Authentication & Security
- **JWT-Based Authentication**: Secure login with 24-hour access tokens and 7-day refresh tokens
- **Session Management**: Automatic token refresh and secure logout
- **Protected Routes**: Secure access to user-specific features
- **Password Encryption**: BCrypt hashing for secure password storage

### User Experience
- **Personal Dashboard**: View your listings, saved items, and account statistics
- **Saved Items**: Bookmark items you're interested in
- **Real-time Messaging**: Direct communication between buyers and sellers
- **Study Groups**: Create and join study groups for collaborative learning
- **Responsive Design**: Mobile-friendly interface built with React Bootstrap

### Additional Features
- **Profile Management**: Upload profile pictures and manage account settings
- **Contact Methods**: Support for email and phone contact preferences
- **Item Conditions**: Track item condition (New, Like New, Good, Fair, Poor)
- **Sorting Options**: Sort by newest, oldest, price, or alphabetical order

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19.x with Vite
- **UI Library**: React Bootstrap 5.3.x
- **Routing**: React Router DOM 7.x
- **HTTP Client**: Axios for API communication
- **Icons**: React Icons
- **Forms**: Formik with Yup validation
- **Notifications**: React Toastify

### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express.js 5.x
- **Authentication**: JSON Web Tokens (JWT)
- **Password Hashing**: BCrypt
- **File Upload**: Multer with Cloudinary storage
- **Database**: PostgreSQL with pg driver
- **CORS**: Cross-Origin Resource Sharing enabled

### Cloud Services & Deployment
- **Database**: PostgreSQL (Production)
- **Image Storage**: Cloudinary
- **Deployment**: Heroku
- **Version Control**: Git & GitHub

## 🚀 Live Demo

**Live Application**: [https://dorm-deals-network-1e67636e46cd.herokuapp.com](https://dorm-deals-network-1e67636e46cd.herokuapp.com)

*Note: The application may take a moment to load as it's hosted on Heroku's free tier.*

## 📋 Setup Instructions

### Prerequisites

- **Node.js** (v20.x or higher)
- **PostgreSQL** (v12+ recommended)
- **Git**
- **Cloudinary Account** (for image uploads)

### Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/marketplace_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Environment
NODE_ENV=development
```

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cyeh12/dorm-deals-network.git
   cd dorm-deals-network
   ```

2. **Install server dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**:
   ```bash
   cd client
   npm install
   ```

4. **Set up PostgreSQL database**:
   ```bash
   # Create database
   createdb marketplace_db
   
   # The application will automatically create tables on first run
   ```

5. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

### Running the Application

#### Development Mode

1. **Start the backend server**:
   ```bash
   cd server
   npm start
   # Server runs on http://localhost:5000
   ```

2. **Start the frontend development server** (in a new terminal):
   ```bash
   cd server/client
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

#### Production Mode

```bash
cd server
npm run build
npm start
# Full application runs on the server port
```

## 📁 Project Structure

```
college-student-marketplace/
├── server/
│   ├── index.js                 # Main server file
│   ├── package.json            # Server dependencies
│   ├── .env                    # Environment variables
│   └── client/                 # Frontend application
│       ├── src/
│       │   ├── components/     # Reusable React components
│       │   ├── pages/          # Page components
│       │   ├── context/        # React Context (Auth)
│       │   ├── utils/          # Utility functions
│       │   ├── services/       # API services
│       │   └── styles/         # CSS stylesheets
│       ├── public/             # Static assets
│       ├── package.json        # Client dependencies
│       └── vite.config.js      # Vite configuration
├── database-schema.md          # Database schema documentation
├── JWT_AUTHENTICATION.md      # Authentication documentation
├── README.md                   # This file
└── user-stories.md            # User stories and requirements
```

## 🗄 Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User accounts and profiles
- **universities**: University information and domains
- **items**: Marketplace listings
- **saved_items**: User's saved/bookmarked items
- **messages**: Direct messaging between users
- **study_groups**: Study group information
- **study_group_members**: Study group memberships

*For detailed schema information, see [database-schema.md](database-schema.md)*

## 🔐 Authentication

The application implements JWT-based authentication with:

- **Access Tokens**: 24-hour lifespan for API access
- **Refresh Tokens**: 7-day lifespan for automatic token renewal
- **Automatic Token Refresh**: Seamless user experience
- **Secure Logout**: Token invalidation on logout

*For detailed authentication information, see [JWT_AUTHENTICATION.md](JWT_AUTHENTICATION.md)*

## 🚀 Deployment

### Heroku Deployment

1. **Create Heroku app**:
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**:
   ```bash
   heroku config:set DATABASE_URL=your-postgresql-url
   heroku config:set JWT_SECRET=your-jwt-secret
   heroku config:set CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   # ... other environment variables
   ```

3. **Deploy**:
   ```bash
   git push heroku main
   ```

### Environment Variables for Production

Ensure all environment variables are set in your production environment:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong secret key for JWT signing
- `CLOUDINARY_*`: Cloudinary configuration for image uploads
- `NODE_ENV=production`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/cyeh12/dorm-deals-network/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

## 📞 Contact

**Repository**: [https://github.com/cyeh12/dorm-deals-network](https://github.com/cyeh12/dorm-deals-network)

---

**Made with ❤️ for the student community**

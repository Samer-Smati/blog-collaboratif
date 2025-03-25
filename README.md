# Blog Collaboratif

A collaborative blogging platform built with Angular for the frontend and Node.js (Express) for the backend. This platform enables multiple contributors to create, edit, and manage blog content with a sophisticated role-based permission system.

## Features

- **User Management System**:

  - Secure registration and authentication
  - Role-based access control (admin, editor, writer, reader)
  - Profile management

- **Article Management**:

  - Create, edit, publish, and delete articles
  - Draft saving functionality
  - Article versioning and history
  - Multiple status options (draft, published, archived, deleted)
  - Rich text editor with image embedding

- **Comments & Interaction**:

  - Threaded comments with reply functionality
  - Comment moderation tools
  - Real-time updates

- **Content Organization**:

  - Tag-based categorization
  - Search functionality with multiple filters
  - Featured content management

- **Analytics Dashboard**:

  - View and export article statistics
  - Reader engagement metrics
  - Popular content tracking
  - Data visualization with charts

- **Notification System**:

  - Real-time notifications for new comments
  - Publishing notifications
  - Activity alerts

- **Responsive Design**:
  - Mobile-first approach
  - Cross-browser compatibility
  - Accessible user interface

## Installation Instructions

### Prerequisites

- Node.js (v14+)
- npm (v6+)
- MongoDB (v4+)
- Angular CLI (latest)

### Backend Installation

1. Clone the repository and navigate to the backend directory:

   ```
   git clone https://github.com/yourusername/blog-collaboratif.git
   cd blog-collaboratif/backend
   ```

2. Install dependencies (use --force if you encounter dependency conflicts):

   ```
   npm install --force
   ```

3. Create a `.env` file in the backend directory with the following variables:

   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/blog-collaboratif
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
   NODE_ENV=development
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100
   ```

4. Start the backend server:

   For development with auto-restart:

   ```
   npm run dev
   ```

   For production:

   ```
   npm start
   ```

   The server will be running at http://localhost:3000

### Frontend Installation

1. Navigate to the frontend directory:

   ```
   cd ../frontend
   ```

2. Install dependencies (use --force if you encounter dependency conflicts):

   ```
   npm install --force
   ```

3. Start the Angular development server:

   ```
   ng serve
   ```

   The application will be accessible at http://localhost:4200

### Docker Setup (Optional)

For containerized deployment:

1. Build and run the Docker containers:
   ```
   docker-compose up -d
   ```

## Technology Stack

### Backend Technologies

- **Node.js**: JavaScript runtime environment
- **Express**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JSON Web Token (JWT)**: Authentication mechanism
- **Socket.io**: Real-time bidirectional communication
- **bcryptjs**: Password hashing
- **Joi**: Data validation
- **Express Rate Limit**: API rate limiting
- **Web-Push**: Notification services
- **Cookie Parser**: Cookie management
- **CORS**: Cross-Origin Resource Sharing

### Frontend Technologies

- **Angular 17**: Frontend framework
- **RxJS**: Reactive Extensions for JavaScript
- **Chart.js**: Data visualization
- **Socket.io Client**: Real-time communication
- **NgRx**: State management (optional)
- **Angular Material**: UI component library
- **ngx-cookie-service**: Cookie management

## Folder Architecture

### Backend Architecture

The backend follows a microservices-oriented architecture:

```
backend/
│
├── microservices/              # Service-oriented modules
│   ├── article-service/        # Article management
│   │   ├── controllers/        # Request handlers
│   │   ├── models/             # Database schemas
│   │   └── routes/             # API endpoints
│   │
│   ├── user-service/           # User management
│   │   ├── controllers/        # Request handlers
│   │   ├── models/             # Database schemas
│   │   └── routes/             # API endpoints
│   │
│   ├── comment-service/        # Comment management
│   │   ├── controllers/        # Request handlers
│   │   ├── models/             # Database schemas
│   │   └── routes/             # API endpoints
│   │
│   └── analytics-service/      # Analytics and statistics
│       ├── controllers/        # Request handlers
│       └── routes/             # API endpoints
│
├── middleware/                 # Express middleware
│   ├── auth.js                 # Authentication middleware
│   ├── roleBaseAccessControl.js# Role-based access control
│   ├── validate.js             # Request validation
│   └── rateLimiter.js          # API rate limiting
│
├── config/                     # Configuration files
│   ├── database.js             # Database connection
│   └── environment.js          # Environment variables
│
├── utils/                      # Utility functions
│   ├── logger.js               # Logging service
│   └── helpers.js              # Helper functions
│
├── validator/                  # Request validation schemas
│   ├── userValidator.js        # User request schemas
│   └── articleValidator.js     # Article request schemas
│
└── server.js                   # Main application entry point
```

### Frontend Architecture

The frontend follows Angular's recommended architecture:

```
frontend/
│
├── src/
│   ├── app/                    # Application source code
│   │   ├── components/         # Shared components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── article/        # Article-related components
│   │   │   ├── user/           # User-related components
│   │   │   └── common/         # Common UI components
│   │   │
│   │   ├── core/               # Core functionality
│   │   │   ├── services/       # Services for API communication
│   │   │   ├── guards/         # Route guards
│   │   │   ├── interceptors/   # HTTP interceptors
│   │   │   └── models/         # Data models/interfaces
│   │   │
│   │   ├── shared/             # Shared modules and utilities
│   │   │   ├── directives/     # Custom directives
│   │   │   ├── pipes/          # Custom pipes
│   │   │   └── utils/          # Utility functions
│   │   │
│   │   └── pages/              # Page components
│   │       ├── home/           # Home page
│   │       ├── article-editor/ # Article editor page
│   │       ├── profile/        # User profile page
│   │       └── admin/          # Admin panel pages
│   │
│   ├── assets/                 # Static assets
│   │   ├── images/             # Image files
│   │   └── styles/             # Global styles
│   │
│   ├── environments/           # Environment configurations
│   └── main.ts                 # Main entry point
│
├── angular.json                # Angular CLI configuration
└── package.json                # Project dependencies
```

## API Documentation

The API documentation is available at http://localhost:3000/api-docs when running the backend server in development mode.

### Key Endpoints

- **User Management**:

  - `POST /api/users/register`: Register new user
  - `POST /api/users/login`: Authenticate user
  - `GET /api/users/profile`: Get user profile

- **Article Management**:

  - `GET /api/articles`: List articles
  - `POST /api/articles`: Create article
  - `GET /api/articles/:id`: Get article by ID
  - `PUT /api/articles/:id`: Update article
  - `DELETE /api/articles/:id`: Delete article

- **Comments**:

  - `GET /api/comments/article/:articleId`: Get comments for article
  - `POST /api/comments`: Create comment
  - `POST /api/comments/:id/replies`: Reply to comment

- **Analytics**:
  - `GET /api/analytics/articles/stats`: Get article statistics
  - `GET /api/analytics/articles/popular`: Get popular articles

## Role-Based Access

The platform implements four primary user roles:

- **Admin**: Full system access
- **Editor**: Article management and moderation
- **Writer**: Content creation and editing
- **Reader**: View and comment on content

## Troubleshooting

### Common Issues

- **MongoDB Connection**: Ensure MongoDB is running on the specified port
- **JWT Authentication**: Check that your JWT_SECRET is correctly set in the .env file
- **CORS Issues**: If experiencing cross-origin problems, verify the CORS settings in server.js

### Dependency Conflicts

If you encounter package compatibility issues during installation, try:

```
npm install --legacy-peer-deps
```

Or:

```
npm install --force
```

#Admin connection

```
email : samersmati@gmail.com
password : Azerty123
```

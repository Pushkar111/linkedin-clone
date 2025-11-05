# LinkedIn Clone - Full Stack Social Media Application

A professional, production-ready LinkedIn clone built with the MERN stack (MongoDB, Express, React, Node.js) featuring real-time messaging, connections, and post interactions.

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey)](https://expressjs.com/)

## 🌟 Features

### Core Features
- ✅ **User Authentication** - Email/Password, Google OAuth
- ✅ **Post Management** - Create, edit, delete posts with text and images
- ✅ **Social Interactions** - Like/unlike posts, comment system
- ✅ **User Profiles** - Customizable profiles with profile pictures
- ✅ **Image Upload** - Cloudinary integration for media storage
- ✅ **Responsive Design** - Mobile-first, works on all devices

### Advanced Features
- ✅ **Connection System** - Send, accept, reject connection requests
- ✅ **Real-time Messaging** - Direct messages with Socket.io
- ✅ **Notifications** - Real-time notifications for activities
- ✅ **Feed Algorithm** - Paginated, optimized post loading
- ✅ **Security** - JWT authentication, rate limiting, input validation

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - UI library
- **Redux Toolkit** - State management
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js 4.18.2** - Web framework
- **MongoDB + Mongoose** - Database and ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Socket.io** - WebSocket server
- **Cloudinary** - Image storage & CDN
- **Helmet** - Security headers
- **Express Validator** - Input validation

## 📦 Project Structure

```
linkedin-clone/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── config/            # Database, Cloudinary config
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API endpoints
│   │   ├── sockets/           # Socket.io handlers
│   │   ├── utils/             # Helper functions
│   │   ├── app.js             # Express app
│   │   └── server.js          # Server entry point
│   ├── Dockerfile             # Backend container
│   ├── package.json
│   └── .env.example
│
├── frontend-reference/         # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── contexts/          # React contexts
│   │   ├── pages/             # Page components
│   │   ├── redux/             # Redux store
│   │   ├── services/          # API services
│   │   ├── utilities/         # Helper functions
│   │   └── App.js
│   ├── Dockerfile             # Frontend container
│   ├── nginx.conf             # Nginx config
│   └── package.json
│
├── kubernetes/                 # Kubernetes deployment files
│   ├── backend-deployment.yml
│   ├── frontend-deployment.yml
│   └── mongodb-deployment.yml
│
├── .github/workflows/          # GitHub Actions CI/CD
│   └── deploy.yml
│
├── docker-compose.yml          # Docker Compose setup
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/Pushkar111/linkedin-demo.git
cd linkedin-demo
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start backend server
npm run dev
```

Backend will run on: http://localhost:5000

### 3. Frontend Setup
```bash
cd frontend-reference
npm install

# Start frontend app
npm start
```

Frontend will run on: http://localhost:3000/linkedin

## 🔐 Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/linkedin-clone

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=10d
JWT_REFRESH_EXPIRE=30d

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)
```bash
# Build and start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: localhost:27017

### Build Individual Containers
```bash
# Build backend
cd backend
docker build -t linkedin-backend .

# Build frontend
cd frontend-reference
docker build -t linkedin-frontend .

# Run containers
docker run -p 5000:5000 linkedin-backend
docker run -p 3000:80 linkedin-frontend
```

## ☸️ Kubernetes Deployment

```bash
# Apply MongoDB deployment
kubectl apply -f kubernetes/mongodb-deployment.yml

# Apply backend deployment
kubectl apply -f kubernetes/backend-deployment.yml

# Apply frontend deployment
kubectl apply -f kubernetes/frontend-deployment.yml

# Check deployments
kubectl get deployments
kubectl get pods
kubectl get services
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Posts
- `GET /api/posts` - Get all posts (paginated)
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Toggle like
- `POST /api/posts/:id/comments` - Add comment

### Users
- `GET /api/users` - Get all users
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile

### Connections
- `POST /api/connections/request` - Send connection request
- `PUT /api/connections/accept/:id` - Accept request
- `PUT /api/connections/reject/:id` - Reject request
- `GET /api/connections` - Get user connections

### Messages
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversation/:id` - Get conversation messages
- `POST /api/messages/send` - Send message

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend-reference
npm test
```

## 🔒 Security Features

- JWT-based authentication with access and refresh tokens
- Password hashing with bcrypt (10 salt rounds)
- HTTP-only cookies for token storage
- Helmet for security headers
- CORS protection
- Rate limiting (configurable per IP)
- Input validation and sanitization
- MongoDB injection protection
- XSS protection

## 📈 Performance Optimizations

- Database indexing for fast queries
- Connection pooling
- Response compression
- Image optimization via Cloudinary
- Lazy loading components
- Code splitting
- Pagination for large datasets
- Caching strategies

## 🔧 Development Scripts

### Backend
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests
```

### Frontend
```bash
npm start        # Start development server
npm run build    # Create production build
npm test         # Run tests
npm run lint     # Run ESLint
```

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Pushkar Modi**
- GitHub: [@Pushkar111](https://github.com/Pushkar111)
- Repository: [linkedin-clone](https://github.com/Pushkar111/linkedin-clone)
- linkedin: [Linkedin](https://linkedin.com/in/pushkarmodi111)

## 🙏 Acknowledgments

- Original frontend design inspired by [pieroguerrero/linkedin](https://github.com/pieroguerrero/linkedin)
- Built for AppDost Full Stack Developer Internship Assignment
- LinkedIn UI/UX patterns and design system

## 📞 Support

For support, email: pushkarmodi111@gmail.com

---

**Made with ❤️ using MERN Stack**

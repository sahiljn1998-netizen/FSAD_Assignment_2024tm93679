# 🎓 School Equipment Lending Portal

A modern, full-stack web application for managing school equipment lending with real-time updates, optimistic UI, and comprehensive booking validation.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.x-blue)

## 📋 Features

### User Features
- 🔐 **User Authentication** - Secure login/registration with JWT tokens
- 🔍 **Equipment Browsing** - View available equipment with filtering by category
- 📝 **Request Management** - Submit equipment requests with date ranges
- 📊 **Request Tracking** - Track request status (pending, approved, issued, returned)
- ⚡ **Optimistic Updates** - Instant UI feedback with automatic rollback on errors
- 🔔 **Toast Notifications** - Real-time feedback for all actions
- ✅ **Availability Checking** - Prevents overlapping bookings

### Admin Features
- 🛠️ **Equipment Management** - Add, edit, and delete equipment
- ✓ **Request Approval** - Approve or reject equipment requests
- 📦 **Equipment Issuance** - Mark equipment as issued to users
- ↩️ **Return Processing** - Process equipment returns
- 📈 **Inventory Tracking** - Monitor available vs. total equipment quantities

### Staff Features
- ✓ **Request Review** - Approve or reject equipment requests
- 👀 **View All Requests** - See all equipment requests in the system

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Material-UI (MUI)** - Component library
- **React Router** - Client-side routing
- **React Toastify** - Toast notifications
- **Custom Hooks** - Optimistic updates with rollback

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing

## 📁 Project Structure

```
school-equipment-lending/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT authentication
│   │   ├── models/
│   │   │   ├── User.js            # User schema
│   │   │   ├── Equipment.js       # Equipment schema
│   │   │   └── Request.js         # Request schema
│   │   ├── routes/
│   │   │   ├── auth.js            # Auth endpoints
│   │   │   ├── equipment.js       # Equipment endpoints
│   │   │   └── requests.js        # Request endpoints
│   │   ├── utils/
│   │   │   └── bookingValidation.js # Booking validation logic
│   │   └── server.js              # Entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common.js          # Shared components
│   │   │   └── RequestForm.js     # Request form component
│   │   ├── contexts/
│   │   │   └── AuthContext.js     # Auth context & hooks
│   │   ├── hooks/
│   │   │   └── useOptimistic.js   # Optimistic update hook
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── EquipmentPage.js
│   │   │   ├── AdminEquipmentPage.js
│   │   │   └── RequestsPage.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── README.md
├── .gitignore
├── BOOKING_VALIDATION.md         # Validation documentation
└── OPTIMISTIC_UPDATES.md          # Optimistic updates documentation

```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/school-equipment-lending.git
   cd school-equipment-lending
   ```

2. **Set up Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/school-equipment
   JWT_SECRET=your_jwt_secret_key_here
   ```

4. **Set up Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start the Application**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm start
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📖 Usage

### User Roles

#### Student
- View available equipment
- Submit equipment requests
- Track own requests

#### Staff
- All student permissions
- Approve/reject equipment requests
- View all requests

#### Admin
- All staff permissions
- Manage equipment (add, edit, delete)
- Issue equipment to users
- Process equipment returns

### Default Users (if seeded)

You can create seed scripts to add default users:

```javascript
// Student
Email: student@example.com
Password: password123

// Staff
Email: staff@example.com
Password: password123

// Admin
Email: admin@example.com
Password: password123
```

## 🔒 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Equipment
- `GET /api/v1/equipment` - Get all equipment
- `POST /api/v1/equipment` - Create equipment (admin)
- `PUT /api/v1/equipment/:id` - Update equipment (admin)
- `DELETE /api/v1/equipment/:id` - Delete equipment (admin)

### Requests
- `GET /api/v1/requests` - Get requests
- `POST /api/v1/requests` - Create request
- `POST /api/v1/requests/check-availability` - Check availability
- `POST /api/v1/requests/:id/approve` - Approve request
- `POST /api/v1/requests/:id/reject` - Reject request
- `POST /api/v1/requests/:id/issue` - Issue equipment
- `POST /api/v1/requests/:id/return` - Mark as returned

## 🎯 Key Features Explained

### Optimistic Updates
The application implements optimistic UI updates for better user experience:
- UI updates immediately when user takes action
- API call happens in background
- Automatic rollback if API call fails
- Loading indicators show processing state

See [OPTIMISTIC_UPDATES.md](./OPTIMISTIC_UPDATES.md) for details.

### Booking Validation
Comprehensive validation prevents overlapping equipment bookings:
- Date range validation (no past dates, max duration)
- Quantity validation
- Availability checking across overlapping periods
- Detailed error messages

See [BOOKING_VALIDATION.md](./BOOKING_VALIDATION.md) for details.

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Equipment browsing and filtering
- [ ] Request creation with validation
- [ ] Request approval workflow
- [ ] Equipment issuance and return
- [ ] Optimistic updates and rollback
- [ ] Toast notifications
- [ ] Overlap prevention

### Future: Automated Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🔧 Configuration

### Backend Configuration

#### MongoDB Connection
Edit `backend/src/config/db.js` to customize MongoDB connection options.

#### JWT Secret
Set a strong JWT secret in `.env`:
```env
JWT_SECRET=your_super_secret_key_at_least_32_characters_long
```

### Frontend Configuration

#### API Base URL
If deploying to production, update API URLs in frontend files:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

## 📦 Deployment

### Backend Deployment (Heroku/Railway/Render)

1. Set environment variables
2. Ensure MongoDB connection string is set
3. Deploy using platform's CLI or Git integration

### Frontend Deployment (Vercel/Netlify)

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the `build` folder

3. Set environment variables for production API URL

## 🐛 Troubleshooting

### Common Issues

**Frontend won't start:**
- Ensure `react-toastify` is installed: `npm install react-toastify`
- Clear node_modules: `rm -rf node_modules && npm install`

**Backend connection error:**
- Check MongoDB is running
- Verify MONGO_URI in `.env`
- Check port 5000 is not in use

**Cannot login/register:**
- Check backend is running
- Verify JWT_SECRET is set in `.env`
- Check MongoDB connection

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request



## 👨‍💻 Author

Your Name - Sahil Jain(https://github.com/sahiljn1998-netizen/FSAD_Assignment_2024tm93679)

## 🙏 Acknowledgments

- Material-UI for the component library
- React community for excellent documentation
- MongoDB for the database solution

## 📞 Support

For support, email your@email.com or open an issue on GitHub.

---

**Built with ❤️ using React, Node.js, and MongoDB**
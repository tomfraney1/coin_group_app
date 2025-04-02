# Coin Group App

A web application for managing and tracking coin locations across different institutions.

## Project Structure

- `frontend/`: React frontend built with Vite
- `backend/`: Express.js backend with TypeScript
- `services/`: Shared services

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Update the variables with your development settings

4. Start the development servers:
   ```bash
   # Start backend
   cd backend
   npm run dev

   # Start frontend
   cd ../frontend
   npm run dev
   ```

## Production Deployment

### Backend Deployment

1. Set up production environment variables:
   - Copy `backend/.env.production` to `backend/.env`
   - Update with your production settings:
     - `MONGODB_URI`: Your production MongoDB connection string
     - `JWT_SECRET`: A secure random string for JWT signing
     - `PORT`: The port number (default: 3001)

2. Build the backend:
   ```bash
   cd backend
   npm run build
   ```

3. Start the production server:
   ```bash
   npm start
   ```

### Frontend Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. The built files will be in the `frontend/dist` directory
3. Deploy these files to your web server

## Security Considerations

1. Always use HTTPS in production
2. Set strong JWT secrets
3. Use environment variables for sensitive data
4. Implement rate limiting
5. Keep dependencies updated

## Monitoring and Maintenance

1. Implement logging
2. Set up health checks
3. Monitor server resources
4. Regular backups of MongoDB data

## License

[Your License] 
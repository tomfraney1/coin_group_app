# Coin Group App

A web application for managing and tracking coin locations across different institutions.

## Project Structure

- `frontend/`: React frontend built with Vite
- `backend/`: Express.js backend with TypeScript
- `services/`: Shared services

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
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
     - `DB_USER`: Your Google Cloud SQL username
     - `DB_PASSWORD`: Your Google Cloud SQL password
     - `DB_NAME`: Your database name
     - `JWT_SECRET`: A secure random string for JWT signing
     - `PORT`: The port number (default: 3001)

2. Build the backend:
   ```bash
   cd backend
   npm run build
   ```

3. Deploy to Google Cloud Run:
   ```bash
   gcloud run deploy coingroup-backend --source .
   ```

### Frontend Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy to Google Cloud Storage:
   ```bash
   gsutil cp -r dist/* gs://your-bucket-name/
   ```

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
4. Regular backups of database data

## License

[Your License] 
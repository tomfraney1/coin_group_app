import { Router } from 'express';
import { query } from '../utils/db';

const router = Router();

router.get('/health', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log('🔍 Health check endpoint called at:', timestamp);
  console.log('🔍 Request details:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    ip: req.ip,
    ips: req.ips,
    hostname: req.hostname,
    protocol: req.protocol,
    secure: req.secure
  });

  try {
    // Test database connection
    await query('SELECT 1');
    console.log('✅ Database connection successful');
    
    res.json({
      status: 'healthy',
      timestamp,
      version: 'v31',
      database: 'connected'
    });
  } catch (error: any) {
    console.error('❌ Database connection failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp,
      version: 'v31',
      database: 'disconnected',
      error: error?.message || 'Unknown error'
    });
  }
});

export default router; 
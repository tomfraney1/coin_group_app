import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { coinLocationService } from '../services/coinLocationService';
import { CoinLocation } from '../types/coin';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Assign coin to location
router.post('/assign', (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { coinId, location } = req.body;
    const userId = req.user?.userId;

    if (!coinId || !location || !userId) {
      console.error('Missing required fields:', { coinId, location, userId });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (!['UCB', '1NAT', 'AMER', 'FID', 'WMP'].includes(location)) {
      res.status(400).json({ error: 'Invalid location' });
      return;
    }

    await coinLocationService.assignCoinToLocation(coinId, location as CoinLocation, userId);
    res.json({ message: 'Coin location updated successfully' });
  } catch (error) {
    console.error('Error in assign route:', error);
    next(error);
  }
}) as RequestHandler);

// Get coin location
router.get('/:coinId', (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = await coinLocationService.getCoinLocation(req.params.coinId);
    if (!location) {
      res.status(404).json({ error: 'Coin location not found' });
      return;
    }
    res.json(location);
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

// Get location history for a coin
router.get('/:coinId/history', (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await coinLocationService.getLocationHistory(req.params.coinId);
    res.json(history);
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

// Get counts for all locations
router.get('/counts', (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const counts = await coinLocationService.getLocationCounts();
    res.json(counts);
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

// Get all coins in a location
router.get('/location/:location', (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = req.params.location as CoinLocation;
    if (!['UCB', '1NAT', 'AMER', 'FID', 'WMP'].includes(location)) {
      res.status(400).json({ error: 'Invalid location' });
      return;
    }

    const coins = await coinLocationService.getCoinsByLocation(location);
    res.json(coins);
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

export default router; 
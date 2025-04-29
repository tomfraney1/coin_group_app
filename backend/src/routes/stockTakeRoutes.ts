import { Router } from 'express';
import { CaseService } from '../services/caseService';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const caseService = new CaseService();

// Get all stock take results
router.get('/', authenticateToken, async (req, res) => {
  try {
    const results = await caseService.getStockTakeResults();
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new stock take result
router.post('/', authenticateToken, async (req, res) => {
  try {
    const result = await caseService.addStockTakeResult(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 
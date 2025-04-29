import { Router } from 'express';
import { CaseService } from '../services/caseService';

const router = Router();
const caseService = new CaseService();

// Public decrement coin quantity
router.post('/decrement-coin', async (req, res) => {
  try {
    const { barcode, decrementAmount } = req.body;
    
    if (!barcode || decrementAmount === undefined) {
      return res.status(400).json({ error: 'Barcode and decrement amount are required' });
    }

    const result = await caseService.decrementCoinQuantity(barcode, decrementAmount);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Coin not found in any case') {
      res.status(404).json({ error: error.message });
    } else if (error.message === 'Cannot modify coins in a closed case') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router; 
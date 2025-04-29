import { Router } from 'express';
import { CaseService } from '../services/caseService';
import { authenticateToken } from '../middleware/auth';
import CaseNotificationService from '../websocket/caseNotifications';
import { enrichCoin } from '../services/coinEnrichmentService';

const router = Router();
const caseService = new CaseService();

export const initializeCaseRoutes = (notificationService: CaseNotificationService) => {
  // Public decrement coin quantity (no authentication required)
  router.post('/coins/decrement/public', async (req, res) => {
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

  // Get all cases
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const cases = await caseService.getAllCases();
      res.json(cases);
    } catch (error: any) {
      console.error('Error in GET /cases:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      res.status(500).json({ 
        error: error.message,
        detail: error.detail,
        hint: error.hint
      });
    }
  });

  // Get single case
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const caseData = await caseService.getCase(req.params.id);
      res.json(caseData);
    } catch (error: any) {
      if (error.message === 'Case not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Create case
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const { caseNumber } = req.body;
      const userId = req.user?.userId || 'development-user'; // Handle development user
      
      if (!caseNumber) {
        return res.status(400).json({ error: 'Case number is required' });
      }

      const newCase = await caseService.createCase(caseNumber, userId);
      notificationService.notifyCaseCreated(newCase);
      res.status(201).json(newCase);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update case status
  router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      const userId = req.user?.userId || 'development-user'; // Handle development user
      
      if (!status || !['open', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Valid status (open/closed) is required' });
      }

      const updatedCase = await caseService.updateCaseStatus(req.params.id, status, userId);
      notificationService.notifyCaseUpdated(updatedCase);
      res.json(updatedCase);
    } catch (error: any) {
      if (error.message === 'Case not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Add coin to case
  router.post('/:id/coins', authenticateToken, async (req, res) => {
    try {
      const { barcode, quantity } = req.body;
      const userId = req.user?.userId || 'development-user'; // Handle development user
      
      if (!barcode) {
        return res.status(400).json({ error: 'Barcode is required' });
      }

      // Get enriched coin data - this will now work even if coin is not in database
      const enrichedData = await enrichCoin(barcode);

      const coin = await caseService.addCoinToCase(req.params.id, {
        barcode, // Keep original barcode exactly as scanned
        name: enrichedData.description,
        quantity: quantity || 1
      });

      notificationService.notifyCoinAdded(req.params.id, coin);
      res.status(201).json(coin);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Remove coin from case
  router.delete('/:caseId/coins/:barcode', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.userId || 'development-user'; // Handle development user
      await caseService.removeCoinFromCase(req.params.caseId, req.params.barcode, userId);
      notificationService.notifyCoinRemoved(req.params.caseId, req.params.barcode);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Get case history
  router.get('/:id/history', authenticateToken, async (req, res) => {
    try {
      const history = await caseService.getCaseHistory(req.params.id);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete case
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.userId || 'development-user';
      await caseService.deleteCase(req.params.id, userId);
      notificationService.notifyCaseDeleted(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Case not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Decrement coin quantity
  router.post('/coins/decrement', authenticateToken, async (req, res) => {
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

  return router;
}; 
import express from 'express';
import { spotPriceService } from '../services/spotPriceService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query;
    const products = await spotPriceService.getAllProducts(type as 'fixed' | 'percentage' | undefined);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await spotPriceService.getProductById(parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const product = await spotPriceService.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const [updatedCount, updatedProducts] = await spotPriceService.updateProduct(
      parseInt(req.params.id),
      req.body
    );
    if (updatedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updatedProducts[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedCount = await spotPriceService.deleteProduct(parseInt(req.params.id));
    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get products by coin ID
router.get('/coin/:coinId', authenticateToken, async (req, res) => {
  try {
    const products = await spotPriceService.getProductsByCoinId(req.params.coinId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get products by metal
router.get('/metal/:metal', authenticateToken, async (req, res) => {
  try {
    const products = await spotPriceService.getProductsByMetal(req.params.metal as 'Gold' | 'Silver');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get products by type and metal
router.get('/type/:type/metal/:metal', authenticateToken, async (req, res) => {
  try {
    const products = await spotPriceService.getProductsByTypeAndMetal(
      req.params.type as 'fixed' | 'percentage',
      req.params.metal as 'Gold' | 'Silver'
    );
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

export default router; 
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Location } from '../models/location';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

type AsyncRequestHandler = RequestHandler<any, any, any, any>;

const getAllLocations: AsyncRequestHandler = (req, res, next) => {
  prisma.location.findMany()
    .then(locations => {
      res.json(locations);
    })
    .catch(next);
};

const createLocation: AsyncRequestHandler = (req, res, next) => {
  const { name, address, city, state, zipCode } = req.body;
  prisma.location.create({
    data: {
      name,
      address,
      city,
      state,
      zipCode
    }
  })
    .then(location => {
      res.status(201).json(location);
    })
    .catch(next);
};

const getLocationById: AsyncRequestHandler = (req, res, next) => {
  const id = parseInt(req.params.id);
  prisma.location.findUnique({
    where: { id }
  })
    .then(location => {
      if (!location) {
        res.status(404).json({ message: 'Location not found' });
        return;
      }
      res.json(location);
    })
    .catch(next);
};

const updateLocation: AsyncRequestHandler = (req, res, next) => {
  const id = parseInt(req.params.id);
  const { name, address, city, state, zipCode } = req.body;
  prisma.location.update({
    where: { id },
    data: {
      name,
      address,
      city,
      state,
      zipCode
    }
  })
    .then(location => {
      res.json(location);
    })
    .catch(next);
};

const deleteLocation: AsyncRequestHandler = (req, res, next) => {
  const id = parseInt(req.params.id);
  prisma.location.delete({
    where: { id }
  })
    .then(() => {
      res.status(204).send();
    })
    .catch(next);
};

const seedLocations: AsyncRequestHandler = (req, res, next) => {
  prisma.location.deleteMany()
    .then(() => {
      return prisma.location.createMany({
        data: [
          {
            name: 'Test Location 1',
            address: '123 Test St',
            city: 'Testville',
            state: 'TS',
            zipCode: '12345'
          },
          {
            name: 'Test Location 2',
            address: '456 Test Ave',
            city: 'Testburg',
            state: 'TS',
            zipCode: '67890'
          }
        ]
      });
    })
    .then(() => {
      res.status(201).json({ message: 'Test locations seeded successfully' });
    })
    .catch(next);
};

router.get('/', authenticateToken, getAllLocations);
router.post('/', authenticateToken, createLocation);
router.get('/:id', authenticateToken, getLocationById);
router.put('/:id', authenticateToken, updateLocation);
router.delete('/:id', authenticateToken, deleteLocation);
router.post('/seed', authenticateToken, seedLocations);

export default router;
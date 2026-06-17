// routes/client.routes.mjs

import express from 'express';

import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientLedger,
} from '../controllers/client.controller.js';

import { protect } from '../middleware/auth.js';
import { paginate } from '../middleware/paginate.js';

const router = express.Router();

router.use(protect);

router.get('/', paginate, getClients);

router.post('/', createClient);

router.get('/:id', getClient);

router.put('/:id', updateClient);

router.delete('/:id', deleteClient);

router.get('/:id/ledger', getClientLedger);

export default router;
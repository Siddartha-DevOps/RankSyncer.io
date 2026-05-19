import { Router } from 'express';
export const router = Router();

// Mock billing for SaaS parity
router.get('/subscription', (req, res) => {
  res.json({ plan: 'STARTER', status: 'active', renewalDate: '2026-06-19' });
});

router.post('/checkout', (req, res) => {
  res.json({ url: 'https://checkout.paddle.com/mock' });
});

router.post('/webhook', (req, res) => {
  res.json({ received: true });
});

export default router;

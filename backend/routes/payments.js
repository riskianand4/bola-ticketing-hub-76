const express = require('express');
const axios = require('axios');
const { getDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create Xendit payment
router.post('/xendit/create', authenticateToken, async (req, res) => {
  try {
    const { amount, description, customer_data, type, ticket_id } = req.body;
    const db = getDB();

    const externalId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const invoiceData = {
      external_id: externalId,
      amount: amount,
      description: description,
      invoice_duration: 86400,
      customer: customer_data,
      success_redirect_url: `${process.env.FRONTEND_URL}/payment/success`,
      failure_redirect_url: `${process.env.FRONTEND_URL}/payment/failed`,
      currency: 'IDR'
    };

    const xenditResponse = await axios.post(
      'https://api.xendit.co/v2/invoices',
      invoiceData,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Save order details if it's a ticket purchase
    if (type === 'ticket' && ticket_id) {
      await db.query(
        'UPDATE ticket_orders SET payment_reference = $1, payment_method = $2 WHERE id = $3',
        [externalId, 'xendit', ticket_id]
      );
    }

    res.json({
      invoice_url: xenditResponse.data.invoice_url,
      external_id: externalId,
      status: xenditResponse.data.status
    });
  } catch (error) {
    console.error('Xendit payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Xendit webhook
router.post('/xendit/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    const db = getDB();

    if (webhookData.external_id && webhookData.status) {
      const paymentStatus = webhookData.status === 'PAID' ? 'completed' : 
                           webhookData.status === 'EXPIRED' ? 'failed' : 'pending';

      // Update ticket orders
      await db.query(
        'UPDATE ticket_orders SET payment_status = $1, updated_at = NOW() WHERE payment_reference = $2',
        [paymentStatus, webhookData.external_id]
      );

      // Update merchandise orders
      await db.query(
        'UPDATE merchandise_orders SET payment_status = $1, updated_at = NOW() WHERE payment_reference = $2',
        [paymentStatus, webhookData.external_id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
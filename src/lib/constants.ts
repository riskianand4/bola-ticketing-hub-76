// Application constants
export const XENDIT_API_KEY = import.meta.env.VITE_XENDIT_SECRET_KEY || 'xnd_development_your_key_here';

// Note: In production, you should never expose your Xendit secret key in the frontend
// This is for development only. In production, you should use edge functions or backend API
export const DEVELOPMENT_MODE = true;

export const PAYMENT_CONFIG = {
  currency: 'IDR',
  invoice_duration: 86400, // 24 hours
  success_redirect_url: `${window.location.origin}/tickets/confirmation`,
  failure_redirect_url: `${window.location.origin}/payment?failed=true`,
};
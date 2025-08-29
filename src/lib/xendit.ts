// Xendit integration utilities for client-side payment
export interface XenditInvoiceRequest {
  external_id: string;
  amount: number;
  description: string;
  invoice_duration?: number;
  customer?: {
    given_names: string;
    email: string;
    mobile_number: string;
  };
  success_redirect_url?: string;
  failure_redirect_url?: string;
  currency?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface XenditInvoiceResponse {
  id: string;
  external_id: string;
  invoice_url: string;
  status: string;
  amount: number;
  created: string;
  updated: string;
}

// Create Xendit payment invoice directly
export async function createXenditInvoice(
  invoiceData: XenditInvoiceRequest, 
  apiKey: string
): Promise<XenditInvoiceResponse> {
  const response = await fetch('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(apiKey + ':')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...invoiceData,
      currency: invoiceData.currency || 'IDR',
      invoice_duration: invoiceData.invoice_duration || 86400, // 24 hours
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Xendit API error:', errorData);
    throw new Error('Failed to create payment invoice');
  }

  return response.json();
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Generate unique external ID
export function generateExternalId(prefix: string = 'TXN'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PendingPayment {
  paymentUrl: string;
  externalId: string;
  amount: number;
  description: string;
  createdAt: Date;
}

interface PaymentContextType {
  pendingPayment: PendingPayment | null;
  setPendingPayment: (payment: PendingPayment | null) => void;
  clearPendingPayment: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pendingPayment, setPendingPaymentState] = useState<PendingPayment | null>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem('pendingPayment');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if payment is not older than 30 minutes
        const createdAt = new Date(parsed.createdAt);
        const now = new Date();
        const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        
        if (diffMinutes < 30) {
          return { ...parsed, createdAt };
        } else {
          localStorage.removeItem('pendingPayment');
        }
      } catch (error) {
        localStorage.removeItem('pendingPayment');
      }
    }
    return null;
  });

  const setPendingPayment = (payment: PendingPayment | null) => {
    setPendingPaymentState(payment);
    if (payment) {
      localStorage.setItem('pendingPayment', JSON.stringify(payment));
    } else {
      localStorage.removeItem('pendingPayment');
    }
  };

  const clearPendingPayment = () => {
    setPendingPayment(null);
  };

  return (
    <PaymentContext.Provider
      value={{
        pendingPayment,
        setPendingPayment,
        clearPendingPayment,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};
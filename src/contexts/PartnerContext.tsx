import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface PartnerContextType {
  isPartner: boolean;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  getDiscountedPrice: (originalPrice: number, isHosting?: boolean) => number;
  discountPercent: number;
  partnerName: string;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export function PartnerProvider({ children }: { children: ReactNode }) {
  const [isPartner, setIsPartner] = useState<boolean>(() => {
    return localStorage.getItem('isPartner') === 'true';
  });

  const [discountPercent, setDiscountPercent] = useState<number>(() => {
    const saved = localStorage.getItem('partnerDiscount');
    return saved ? parseInt(saved) : 10;
  });

  const [partnerName, setPartnerName] = useState<string>(() => {
    return localStorage.getItem('partnerName') || '';
  });

  useEffect(() => {
    localStorage.setItem('isPartner', isPartner.toString());
    localStorage.setItem('partnerDiscount', discountPercent.toString());
    localStorage.setItem('partnerName', partnerName);
  }, [isPartner, discountPercent, partnerName]);

  const login = async (loginValue: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/pyapi/a074b7ff-c52b-4b46-a194-d991148dfa59', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login: loginValue,
          password: password
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsPartner(true);
        setDiscountPercent(data.discount_percent);
        setPartnerName(data.name);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Partner login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsPartner(false);
    setDiscountPercent(10);
    setPartnerName('');
    localStorage.removeItem('isPartner');
    localStorage.removeItem('partnerDiscount');
    localStorage.removeItem('partnerName');
  };

  const getDiscountedPrice = (originalPrice: number, isHosting = false): number => {
    if (isHosting || !isPartner) {
      return originalPrice;
    }
    return Math.round(originalPrice * (1 - discountPercent / 100));
  };

  return (
    <PartnerContext.Provider 
      value={{ 
        isPartner, 
        login, 
        logout, 
        getDiscountedPrice,
        discountPercent,
        partnerName
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
}

export function usePartner() {
  const context = useContext(PartnerContext);
  if (context === undefined) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
}

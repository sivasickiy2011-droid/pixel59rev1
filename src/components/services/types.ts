export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface BitrixLicense {
  id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
}

export interface HostingOption {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface BegetTariff {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
}

export interface VPSTariff {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  cpu: string;
  ram: string;
  disk: string;
  traffic: string;
  features: string[];
}
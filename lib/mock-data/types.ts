export type OrderStatus = 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'delivered';

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  sku: string;
  category: string;
  quantity: number;
  minStock: number;
  price: number;
  image: string;
  lastUpdated: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  products: { productId: string; quantity: number; price: number }[];
  status: OrderStatus;
  assignedAgent?: string;
  totalAmount: number;
  createdAt: Date;
  estimatedDelivery?: Date;
  otp?: string;
}

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  currentLocation?: { lat: number; lng: number };
  rating: number;
  totalDeliveries: number;
  assignedOrders: string[];
  photo: string;
}

export interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  apiKey: string;
  webhookUrl?: string;
  createdAt: Date;
}


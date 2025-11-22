import { ProductRequest } from './types';

export const productRequests: ProductRequest[] = [
  {
    id: 'REQ-001',
    organizationId: 'ORG-001',
    organizationName: 'Tech Store Egypt',
    products: [
      { productId: 'NEW-001', productName: 'iPhone 15 Pro Max', productNameAr: 'آيفون 15 برو ماكس', quantity: 50, price: 45000 },
      { productId: 'NEW-002', productName: 'AirPods Pro 2', productNameAr: 'إيربودز برو 2', quantity: 100, price: 8500 },
    ],
    status: 'pending',
    requestedAt: new Date('2024-02-10T09:00:00'),
  },
  {
    id: 'REQ-002',
    organizationId: 'ORG-002',
    organizationName: 'Electronics Hub',
    products: [
      { productId: 'NEW-003', productName: 'Samsung Galaxy S24', productNameAr: 'سامسونج جالاكسي إس 24', quantity: 30, price: 38000 },
    ],
    status: 'approved',
    requestedAt: new Date('2024-02-08T14:30:00'),
    reviewedAt: new Date('2024-02-09T10:15:00'),
    notes: 'Approved - Products added to inventory',
  },
  {
    id: 'REQ-003',
    organizationId: 'ORG-003',
    organizationName: 'Mobile World',
    products: [
      { productId: 'NEW-004', productName: 'iPad Air M2', productNameAr: 'آيباد إير إم 2', quantity: 20, price: 25000 },
      { productId: 'NEW-005', productName: 'Apple Watch Ultra', productNameAr: 'آبل واتش ألترا', quantity: 15, price: 28000 },
    ],
    status: 'partially_accepted',
    requestedAt: new Date('2024-02-07T11:00:00'),
    reviewedAt: new Date('2024-02-08T16:20:00'),
    notes: 'Only iPad Air approved - Apple Watch out of budget',
  },
  {
    id: 'REQ-004',
    organizationId: 'ORG-001',
    organizationName: 'Tech Store Egypt',
    products: [
      { productId: 'NEW-006', productName: 'Sony Headphones WH-1000XM5', productNameAr: 'سوني سماعات دبليو إتش 1000 إكس إم 5', quantity: 40, price: 12000 },
    ],
    status: 'rejected',
    requestedAt: new Date('2024-02-05T08:45:00'),
    reviewedAt: new Date('2024-02-06T09:30:00'),
    notes: 'Rejected - Already have similar product in stock',
  },
  {
    id: 'REQ-005',
    organizationId: 'ORG-004',
    organizationName: 'Gadget Store',
    products: [
      { productId: 'NEW-007', productName: 'MacBook Pro 14" M3', productNameAr: 'ماك بوك برو 14 بوصة إم 3', quantity: 10, price: 75000 },
      { productId: 'NEW-008', productName: 'Magic Keyboard', productNameAr: 'ماجيك كيبورد', quantity: 25, price: 4500 },
    ],
    status: 'pending',
    requestedAt: new Date('2024-02-10T13:20:00'),
  },
];

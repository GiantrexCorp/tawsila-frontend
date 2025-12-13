export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  status: 'active' | 'inactive';
  lastActive: Date;
  avatar?: string;
}

export const users: User[] = [
  {
    id: 'U001',
    name: 'Admin User',
    email: 'admin@tawsila.com',
    role: 'admin',
    status: 'active',
    lastActive: new Date('2024-02-10T14:30:00'),
  },
  {
    id: 'U002',
    name: 'Mohamed Hassan',
    email: 'mohamed.hassan@tawsila.com',
    role: 'manager',
    status: 'active',
    lastActive: new Date('2024-02-10T13:15:00'),
  },
  {
    id: 'U003',
    name: 'Sara Ahmed',
    email: 'sara.ahmed@tawsila.com',
    role: 'manager',
    status: 'active',
    lastActive: new Date('2024-02-10T12:45:00'),
  },
  {
    id: 'U004',
    name: 'Khaled Ibrahim',
    email: 'khaled.ibrahim@tawsila.com',
    role: 'viewer',
    status: 'active',
    lastActive: new Date('2024-02-09T16:20:00'),
  },
  {
    id: 'U005',
    name: 'Layla Mostafa',
    email: 'layla.mostafa@tawsila.com',
    role: 'viewer',
    status: 'inactive',
    lastActive: new Date('2024-02-05T10:00:00'),
  },
];




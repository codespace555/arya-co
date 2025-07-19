// types/interfaces.ts

import { Timestamp } from "firebase/firestore";

export type UserRole = 'admin' | 'customer';

export interface Product {
  id?: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  stock: number;
  category?: string;
  createdAt?: Date;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  totalPrice: number;
  status: string;
  userId: string;
  createdAt?: Timestamp;
  orderedAt?: Timestamp;
  deliveryDate?: Timestamp;
}


export interface User {
  id?: string;
  phone: string;
  name?: string;
  email?: string;
  isAdmin: boolean;
  role: UserRole;
  createdAt?: Date;
}

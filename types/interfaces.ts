// types/interfaces.ts

import { Timestamp } from "firebase/firestore";

export type UserRole = 'admin' | 'customer';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export interface Product {
  id?: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  stock: number;
  category?: string;
  createdAt?: Date;
  unit:string
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  totalPrice: number;
  status: OrderStatus
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

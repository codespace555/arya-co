// src/components/OrderCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import {  User, OrderStatus } from '../types/interfaces'; // Import types from our new file

// Props the component will accept
interface OrderCardProps {
  item: Order;
  user: User | undefined;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
}
 interface Order {
  id: string;
  userId: string;
  productName: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  status: OrderStatus;
  orderedAt: { toDate: () => Date };
  deliveryDate: { toDate: () => Date };
}
const statusOptions: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColors: { [key in OrderStatus]: string } = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  shipped: 'bg-indigo-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export const OrderCard = React.memo(({ item, user, onStatusUpdate }: OrderCardProps) => {
  return (
    <View className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
      {/* Header */}
      <View className="flex-row items-center justify-between bg-gray-50 p-3">
        <View>
          <Text className="text-base font-bold text-gray-800">{user?.name || 'Unknown User'}</Text>
          <Text className="text-sm text-gray-500">{user?.phone || 'No phone number'}</Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${statusColors[item.status]}`}>
          <Text className="text-xs font-bold capitalize text-white">{item.status}</Text>
        </View>
      </View>

      {/* Body */}
      <View className="p-4">
        <Text className="mb-2 text-lg font-semibold text-gray-900">{item.productName || 'N/A'}</Text>
        <View className="mb-3 flex-row justify-between">
          <Text className="text-gray-600">Quantity: {item.quantity} {item.unit}</Text>
          <Text className="font-bold text-gray-800">Total: ₹{item.totalPrice}</Text>
        </View>
        <View className="border-t border-gray-200 pt-2">
          <Text className="text-xs text-gray-500">Ordered: {format(item.orderedAt.toDate(), 'dd MMM yyyy, hh:mm a')}</Text>
          <Text className="text-xs text-gray-500">Delivery: {format(item.deliveryDate.toDate(), 'dd MMM yyyy')}</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="bg-gray-50 p-3">
        <Text className="mb-2 text-xs font-medium text-gray-500">CHANGE STATUS</Text>
        <View className="flex-row flex-wrap">
          {statusOptions.filter((status) => status !== item.status).map((status) => (
            <TouchableOpacity
              key={status}
              className="mb-2 mr-2 rounded-md bg-gray-200 px-3 py-1.5"
              onPress={() => onStatusUpdate(item.id, status)}>
              <Text className="text-xs font-semibold capitalize text-gray-700">{status}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
});
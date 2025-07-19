import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  TextInput,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  Alert,
  Image,
} from 'react-native';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { DashboardStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigation = useNavigation<StackNavigationProp<DashboardStackParamList>>();

  const fetchOrders = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let q = query(collection(db, 'orders'), orderBy('deliveryDate', 'desc'));
      if (lastDoc && !reset) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const newOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (reset) {
        setOrders(newOrders);
        setFilteredOrders(newOrders);
      } else {
        const combinedOrders = [...orders, ...newOrders];
        setOrders(combinedOrders);
        setFilteredOrders(combinedOrders);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);

    return { name: user ? user.name || 'Unnamed' : 'Unknown User', phone: user.phone };
  };

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  useEffect(() => {
    fetchOrders(true);
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = [...orders];

    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (userFilter) {
      filtered = filtered.filter((order) => order.userId === userFilter);
    }

    if (dateFilter) {
      const dateOnly = dateFilter.toDateString();
      filtered = filtered.filter((order) => {
        const orderDate = order.deliveryDate?.toDate?.().toDateString?.();
        return orderDate === dateOnly;
      });
    }
    
    setFilteredOrders(filtered);
    fetchUsers();
  }, [statusFilter, userFilter, dateFilter, orders]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    console.log('Attempting to update status for order:', id, 'to', newStatus);

    Alert.alert(
      'Confirm Status Update',
      'Are you sure you want to update the status?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              if (!id || !newStatus) {
                throw new Error('Invalid order id or status.');
              }

              await updateDoc(doc(db, 'orders', id), { status: newStatus });

              Toast.show({
                type: 'success',
                text1: 'Order status updated successfully',
              });

              await fetchOrders(true);
            } catch (error) {
              console.error('Error updating status:', error);

              Toast.show({
                type: 'error',
                text1: 'Failed to update order status',
                text2: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };
  
  const exportToExcel = async () => {
    const orders = filteredOrders.map((order) => {
      return {
        id: order.id,
        customer: getUserName(order.userId).name,
        customerPhone: getUserName(order.userId).phone,
        orderDate: order.orderedAt.toDate(),
        status: order.status,
        DeliveryDate: order.deliveryDate.toDate(),
        ProductName: order.productName,
        Price: order.price,
        Quantity: order.quantity,
        Unit: order.unit,
        Total: order.totalPrice,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(orders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    const uri = FileSystem.cacheDirectory + 'orders.xlsx';
    const data = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    await FileSystem.writeAsStringAsync(uri, data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  };

  return (
    <View className="flex-1 bg-white p-4">
      <View className="">
        <Text className="mb-4 text-center text-xl font-bold text-blue-700"> Filter by</Text>
        <View className=" mb-4 w-full flex-row justify-between rounded-lg p-2">
          <View className="flex-1">
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text className="mb-2 text-blue-600 underline">Pick a Date</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateFilter || new Date()}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDateFilter(selectedDate);
                }}
              />
            )}
          </View>
          <View className="flex-1">
            <Pressable onPress={() => setModalVisible(true)}>
              <Text className="text-blue-600 underline ">{statusFilter || 'Select Status'}</Text>
            </Pressable>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}>
              <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                <View className="flex-1 items-center justify-center bg-black/50">
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View className="w-11/12 rounded-2xl bg-white p-4 shadow-lg">
                      <View className="rounded border border-gray-300 bg-black text-sm text-blue-500">
                        <Picker
                          selectedValue={statusFilter}
                          onValueChange={(value) => setStatusFilter(value)}>
                          <Picker.Item label="All" value={null} />
                          <Picker.Item label="Pending" value="pending" />
                          <Picker.Item label="Processing" value="processing" />
                          <Picker.Item label="Shipped" value="shipped" />
                          <Picker.Item label="Delivered" value="delivered" />
                          <Picker.Item label="Cancelled" value="cancelled" />
                        </Picker>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </View>
          <View className="flex-1">
            <Pressable onPress={() => setUserModalVisible(true)}>
              <Text className="mb-2 text-blue-600 underline">{'Select User'}</Text>
            </Pressable>
            <Modal
              animationType="slide"
              transparent={true}
              visible={userModalVisible}
              onRequestClose={() => setUserModalVisible(false)}>
              <TouchableWithoutFeedback onPress={() => setUserModalVisible(false)}>
                <View className="flex-1 items-center justify-center bg-black/50">
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View className="w-11/12 rounded-2xl bg-white p-4 shadow-lg">
                      <View className="mb-4 rounded border border-gray-300 bg-black">
                        <Picker
                          selectedValue={userFilter}
                          onValueChange={(value) => setUserFilter(value)}>
                          <Picker.Item label="All Users" value={null} />
                          {users.map((user) => (
                            <Picker.Item
                              key={user.id}
                              label={user.name || user.phone || 'No Name'}
                              value={user.id}
                            />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </View>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#1e40af" />
      ) : (
        <View className="flex-1 ">
          
          {filteredOrders.length === 0 ? (
            <Text className="mt-4 text-center text-gray-500">No orders found.</Text>
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="mb-3 flex-row  rounded-lg border   bg-gray-100">
                  
                  <View className="mb-3 flex-1  ">
                    <View className="flex items-center bg-gray-500 p-4">
                      <Text className="m-1 text-sm text-gray-400">Order by</Text>
                      <Text className="mb-2 text-xl font-bold text-white">
                        {getUserName(item.userId).name}
                      </Text>
                      <Text className="mb-1">Phone : {getUserName(item.userId).phone}</Text>
                    </View>
                    <View className='px-2'>
                      <Text className="text-lg font-bold text-gray-700">Order Details</Text>
                      <Text className="mb-1 text-lg font-bold ">
                        Product Name :{item.productName || 'No Product'}
                      </Text>
                      <Text className="mb-1">
                        Quantity: {item.quantity} {item.unit}
                      </Text>
                      <Text className="mb-1">Total Price: ₹{item.totalPrice}</Text>
                      <Text className="mb-1">User : {getUserName(item.userId).name}</Text>
                      <Text>
                        Ordered On: {format(item.orderedAt?.toDate(), 'dd MMM yyyy hh:mm a')}
                      </Text>
                      <Text>
                        Delivery Date: {format(item.deliveryDate?.toDate(), 'dd MMM yyyy')}
                      </Text>
                      <Text className="mb-2">Status: {item.status}</Text>
                    </View>

                    

                    <View className="flex-row flex-wrap bg-gray-700 p-2">
                      <Text className="m-1 text-sm text-gray-400">Change Status : </Text>
                      {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(
                        (status) => (
                          <TouchableOpacity
                            key={status}
                            className="mb-2 mr-2 rounded bg-blue-500 px-3 py-1"
                            onPress={() => handleStatusUpdate(item.id, status)}>
                            <Text className="text-white">{status}</Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </View>
                </View>
              )}
              ListFooterComponent={
                loadingMore ? <ActivityIndicator size="small" color="#1e40af" /> : null
              }
            />
          )}
        </View>
      )}
      <View className="flex-row justify-between p-5">
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("AddOrder")
          }
          className="rounded bg-green-600 p-4 ">
          <Text className="text-center font-semibold text-white">Add Order</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={exportToExcel} className="rounded bg-blue-600 p-4">
          <Text className="text-center font-semibold text-white">Export to Excel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

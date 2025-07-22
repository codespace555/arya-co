import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { User, OrderStatus } from '../types/interfaces'; // Using your specified import path

interface FilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  onApply: (filters: { status: OrderStatus | null; user: string | null; date: Date | null }) => void;
  onClear: () => void;
  currentFilters: {
    status: OrderStatus | null;
    user: string | null;
    date: Date | null;
  };
  users: User[];
}

export const FilterModal = ({ isVisible, onClose, onApply, onClear, currentFilters, users }: FilterModalProps) => {
  const [tempStatus, setTempStatus] = useState<OrderStatus | null>(null);
  const [tempUser, setTempUser] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // When the modal becomes visible, reset the temporary state to match the current active filters
  useEffect(() => {
    if (isVisible) {
      setTempStatus(currentFilters.status);
      setTempUser(currentFilters.user);
      setTempDate(currentFilters.date);
      // Ensure date picker is hidden when modal re-opens
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  }, [isVisible, currentFilters]);

  // This function handles the date change from the DateTimePicker
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // On Android, the picker is dismissed automatically. On iOS, we need to hide it manually.
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleApply = () => {
    onApply({ status: tempStatus, user: tempUser, date: tempDate });
  };

  const handleClear = () => {
    // This function now correctly clears the temporary state inside the modal
    // before calling the parent's clear function.
    setTempStatus(null);
    setTempUser(null);
    setTempDate(null);
    onClear();
  };

  const renderDatePicker = () => {
    if (!showDatePicker) return null;

    // Android shows a native dialog, which is fine.
    // For iOS, we render it inline if the button has been pressed.
    return (
      <DateTimePicker
        value={tempDate || new Date()}
        mode="date"
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
        onChange={onDateChange}
         
      />
    );
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.grabber} />
          <Text style={styles.title}>Filter Orders</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>STATUS</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={tempStatus} onValueChange={(itemValue) => setTempStatus(itemValue)} itemStyle={{color: '#FFFFFF'}}>
              <Picker.Item label="All Statuses" value={null} color="#FFFFFF" />
              <Picker.Item label="Pending" value="pending" color="#FFFFFF" />
              <Picker.Item label="Processing" value="processing" color="#FFFFFF" />
              <Picker.Item label="Shipped" value="shipped" color="#FFFFFF" />
              <Picker.Item label="Delivered" value="delivered" color="#FFFFFF" />
              <Picker.Item label="Cancelled" value="cancelled" color="#FFFFFF" />
            </Picker>
          </View>

          <Text style={styles.label}>CUSTOMER</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={tempUser} onValueChange={(itemValue) => setTempUser(itemValue)} itemStyle={{color: '#FFFFFF'}}>
              <Picker.Item label="All Customers" value={null} color="#FFFFFF"/>
              {users.map((user) => (
                <Picker.Item key={user.id} label={user.name || user.phone || 'N/A'} value={user.id} color="#FFFFFF" />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>DELIVERY DATE</Text>
          {Platform.OS === 'android' && (
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonText}>
                {tempDate ? format(tempDate, 'dd MMMM, yyyy') : 'Select a Date'}
              </Text>
            </TouchableOpacity>
          )}
          {/* On iOS, the button is replaced by the inline picker */}
          {Platform.OS === 'ios' && !showDatePicker && (
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonText}>
                {tempDate ? format(tempDate, 'dd MMMM, yyyy') : 'Select a Date'}
              </Text>
            </TouchableOpacity>
          )}
          {renderDatePicker()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    backgroundColor: '#111827', // Dark background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '85%', // Ensure modal doesn't cover the whole screen
  },
  header: {
    alignItems: 'center',
    paddingBottom: 10,
    position: 'relative', // For absolute positioning of the close button
  },
  grabber: {
    width: 40,
    height: 5,
    backgroundColor: '#4B5563', // Darker grabber
    borderRadius: 2.5,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F9FAFB', // Light text
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 5,
    backgroundColor: '#374151', // Darker button background
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#D1D5DB', // Light text
    fontWeight: 'bold',
    fontSize: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF', // Lighter gray for label
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#1F2937', // Darker picker background
    borderWidth: 1,
    borderColor: '#374151', // Darker border
    borderRadius: 12,
    justifyContent: 'center',
  },
  dateButton: {
    backgroundColor: '#1F2937', // Darker button background
    borderWidth: 1,
    borderColor: '#374151', // Darker border
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#F9FAFB', // Light text
  },
  footer: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20, // Extra padding for home bar on iOS
    borderTopWidth: 1,
    borderTopColor: '#374151', // Darker separator
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#374151', // Darker button background
    alignItems: 'center',
    marginRight: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D1D5DB', // Light text
  },
  applyButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6', // Vibrant blue
    alignItems: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

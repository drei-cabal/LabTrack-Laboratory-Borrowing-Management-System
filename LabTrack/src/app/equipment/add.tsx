import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { equipmentController } from '../../server/controllers/equipmentController';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Input } from '../../components/ui/Input';
import { QuantityStepper } from '../../components/ui/QuantityStepper';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../routing/routes';

export default function AddEquipmentScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    try {
      setLoading(true);
      setErrors({});

      const res = await equipmentController.create({
        name,
        description,
        total_quantity: quantity,
      });

      if (res.success) {
        Alert.alert('Success', 'Equipment successfully added to inventory!', [
          {
            text: 'OK',
            onPress: () => {
              router.replace(ROUTES.EQUIPMENT as any);
            },
          },
        ]);
      } else {
        if (res.errors) {
          setErrors(res.errors);
        } else {
          Alert.alert('Error', res.error || 'Failed to add equipment.');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader title="Add Equipment" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Input
            label="Equipment Name"
            placeholder="e.g. Digital Multimeter"
            value={name}
            onChangeText={(val) => {
              setName(val);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={errors.name}
            autoFocus
          />

          <Input
            label="Description"
            placeholder="Model, brand, or notes about this item"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <QuantityStepper
            label="Total Quantity"
            value={quantity}
            onChange={setQuantity}
            min={1}
          />

          <Button
            title="Save Equipment"
            variant="primary"
            onPress={handleSave}
            loading={loading}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  saveBtn: {
    marginTop: 8,
  },
});

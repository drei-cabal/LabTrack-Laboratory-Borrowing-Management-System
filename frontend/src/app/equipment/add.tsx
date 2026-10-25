import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { equipmentService } from '../../services/equipmentService';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Input } from '../../components/ui/Input';
import { QuantityStepper } from '../../components/ui/QuantityStepper';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../routing/routes';

export default function AddEquipmentScreen() {
  const router = useRouter();
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    try {
      setLoading(true);
      setErrors({});

      // Combine description with model/brand if description is empty or use description directly
      const displayDesc = description.trim() || [brand, model].filter(Boolean).join(' ') || 'Standard lab equipment';

      const res = await equipmentService.create({
        product_id: productId.trim(),
        name,
        brand,
        model,
        description: displayDesc,
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
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScreenHeader title="Add Equipment" variant="detail" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Product ID */}
          <Input
            label="Product ID / Asset Tag"
            placeholder="e.g. EQ-2026-001"
            value={productId}
            onChangeText={setProductId}
            autoCapitalize="characters"
          />

          {/* Equipment Name */}
          <Input
            label="Equipment Name"
            placeholder="e.g. Digital Multimeter"
            value={name}
            onChangeText={(val) => {
              setName(val);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={errors.name}
          />

          {/* Brand */}
          <Input
            label="Brand / Manufacturer"
            placeholder="e.g. Fluke, Rigol, Hakko"
            value={brand}
            onChangeText={setBrand}
          />

          {/* Model */}
          <Input
            label="Model / Number"
            placeholder="e.g. 117 True RMS, DS1054Z"
            value={model}
            onChangeText={setModel}
          />

          {/* Description / Notes */}
          <Input
            label="Description & Specifications"
            placeholder="Additional notes, specifications, or location notes"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {/* Quantity Stepper */}
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

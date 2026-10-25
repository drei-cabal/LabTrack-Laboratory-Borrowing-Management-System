import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEquipmentDetail } from '../../../hooks/useEquipmentDetail';
import { equipmentService } from '../../../services/equipmentService';
import { AppColors } from '../../../constants/colors';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Input } from '../../../components/ui/Input';
import { QuantityStepper } from '../../../components/ui/QuantityStepper';
import { Button } from '../../../components/ui/Button';
import { ROUTES } from '../../../routing/routes';

export default function EditEquipmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { equipment, loading: fetching } = useEquipmentDetail(id);

  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (equipment) {
      setProductId(equipment.product_id || '');
      setName(equipment.name);
      setBrand(equipment.brand || '');
      setModel(equipment.model || '');
      setDescription(equipment.description || '');
      setQuantity(equipment.total_quantity);
    }
  }, [equipment]);

  const handleSave = async () => {
    if (!equipment) return;

    try {
      setSaving(true);
      setErrors({});

      const res = await equipmentService.update(equipment.id, {
        product_id: productId.trim(),
        name,
        brand,
        model,
        description,
        total_quantity: quantity,
      });

      if (res.success) {
        Alert.alert('Success', 'Equipment details updated!', [
          {
            text: 'OK',
            onPress: () => {
              router.replace(ROUTES.EQUIPMENT_DETAIL(equipment.id) as any);
            },
          },
        ]);
      } else {
        if (res.errors) {
          setErrors(res.errors);
        } else {
          Alert.alert('Error', res.error || 'Failed to update equipment.');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!equipment) return;

    if (equipment.borrowed_count > 0) {
      Alert.alert(
        'Cannot Delete',
        `This item cannot be deleted because there are currently ${equipment.borrowed_count} active borrowed item(s). Please ensure all items are returned first.`
      );
      return;
    }

    Alert.alert(
      'Delete Equipment',
      `Are you sure you want to permanently delete "${equipment.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const res = await equipmentService.delete(equipment.id);
            setDeleting(false);
            if (res.success) {
              Alert.alert('Deleted', 'Equipment has been removed.', [
                {
                  text: 'OK',
                  onPress: () => router.replace(ROUTES.EQUIPMENT as any),
                },
              ]);
            } else {
              Alert.alert('Error', res.error || 'Failed to delete equipment.');
            }
          },
        },
      ]
    );
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <ScreenHeader title="Edit Equipment" variant="detail" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.navy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScreenHeader title="Edit Equipment" variant="detail" />
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
            label="Product ID / Asset Tag"
            value={productId}
            onChangeText={setProductId}
            autoCapitalize="characters"
          />

          <Input
            label="Equipment Name"
            value={name}
            onChangeText={(val) => {
              setName(val);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={errors.name}
          />

          <Input
            label="Brand / Manufacturer"
            value={brand}
            onChangeText={setBrand}
          />

          <Input
            label="Model / Number"
            value={model}
            onChangeText={setModel}
          />

          <Input
            label="Description & Specifications"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <QuantityStepper
            label="Total Quantity"
            value={quantity}
            onChange={setQuantity}
            min={equipment?.borrowed_count || 1}
          />

          <Button
            title="Save Equipment"
            variant="primary"
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />

          <Button
            title="Delete Equipment"
            variant="danger-outline"
            onPress={handleDelete}
            loading={deleting}
            style={styles.deleteBtn}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    marginTop: 8,
    marginBottom: 12,
  },
  deleteBtn: {
    marginBottom: 20,
  },
});

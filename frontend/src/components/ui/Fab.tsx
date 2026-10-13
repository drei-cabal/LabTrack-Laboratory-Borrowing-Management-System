import { useState, type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AppColors } from '../../constants/colors';

type FabProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  visible?: boolean;
};

export function Fab({ icon, label, onPress, visible = true }: FabProps) {
  const [hovered, setHovered] = useState(false);

  if (!visible) return null;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.fab, hovered && styles.hovered, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={AppColors.white} />
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 10,
    minHeight: 44,
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.navy,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  hovered: {
    backgroundColor: AppColors.navyDark,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
});

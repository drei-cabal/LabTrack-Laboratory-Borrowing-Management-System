import { StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';

export const screenStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

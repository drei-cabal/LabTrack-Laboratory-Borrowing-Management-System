import { Platform } from 'react-native';

// Keep the platform font already used by React Native and React Native Web.
export const AppTypography = {
  fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
  size: {
    title: 24,
    detailTitle: 18,
    section: 16,
    body: 14,
    supporting: 13,
    small: 12,
    chip: 11,
    button: 14,
    micro: 10,
    bodyStrong: 15,
    quantity: 17,
    large: 20,
    display: 22,
  },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700', heavy: '800' },
  lineHeight: { body: 20, supporting: 18, small: 16, chip: 15, button: 20 },
} as const;

import { AppTypography } from '../../constants/typography';
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/colors';

import { tokenStore } from '../../services/tokenStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const isIos = Platform.OS === 'ios';
  const bottomInset = insets.bottom;

  const [isAdmin, setIsAdmin] = React.useState(true);

  React.useEffect(() => {
    tokenStore.getUser().then((user) => {
      if (user) {
        setIsAdmin(user.role === 'admin');
      }
    });
  }, []);

  const tabMinHeight = (isIos ? 60 : 70) + bottomInset;
  const tabPaddingBottom = Math.max(bottomInset, isIos ? 16 : 12);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{

        headerShown: false,
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: AppColors.navy,
        tabBarInactiveTintColor: AppColors.textMuted,
        tabBarStyle: {
          backgroundColor: AppColors.white,
          borderTopWidth: 1,
          borderTopColor: AppColors.border,
          height: 'auto',
          minHeight: tabMinHeight,
          flexShrink: 0,
          paddingBottom: tabPaddingBottom,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          minHeight: 56,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontFamily: AppTypography.fontFamily,
          fontSize: AppTypography.size.chip,
          fontWeight: AppTypography.weight.medium,
          lineHeight: AppTypography.lineHeight.small,
          maxWidth: '100%',
          flexShrink: 0,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="equipment"
        options={{
          title: 'Equipment',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'cube' : 'cube-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="borrow"
        options={{
          title: 'Borrow',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Staff',
          href: isAdmin ? '/staff' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

    </Tabs>
  );
}

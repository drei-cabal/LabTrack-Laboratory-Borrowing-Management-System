import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabPageLayoutProps = {
  header: React.ReactNode;
  children: React.ReactNode;
  floatingAction?: React.ReactNode;
  backgroundColor: string;
};

export function TabPageLayout({ header, children, floatingAction, backgroundColor }: TabPageLayoutProps) {
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor }]} edges={['left', 'right']}>
      {header}
      <View style={styles.body}>{children}</View>
      {floatingAction}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, minHeight: 0, paddingTop: 12 },
});

export const tabPageStyles = StyleSheet.create({
  bodyGutters: { paddingHorizontal: 16 },
  searchFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    height: 42,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  listAfterFilters: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 90 },
  listWithoutControls: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 90 },
});

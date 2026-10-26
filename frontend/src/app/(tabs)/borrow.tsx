import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors } from '../../constants/colors';
import { AppTypography } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { TabPageLayout } from '../../components/ui/TabPageLayout';
import { ROUTES } from '../../routing/routes';
import { useGuardedPress } from '../../utils/guards';

const TRANSACTION_STEPS = [
  { icon: 'person-outline', label: 'Borrower' },
  { icon: 'cube-outline', label: 'Equipment' },
  { icon: 'calendar-outline', label: 'Schedule' },
  { icon: 'checkmark-done-outline', label: 'Review' },
] as const;

export default function BorrowScreen() {
  const router = useRouter();
  const handleNewTransaction = useGuardedPress(() => {
    router.push(ROUTES.BORROW_NEW);
  }, 500);

  return (
    <TabPageLayout
      backgroundColor={AppColors.background}
      header={<ScreenHeader variant="tab" title="Borrowing" icon="swap-horizontal-outline" />}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>NEW TRANSACTION</Text>
          </View>

          <View style={styles.illustration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={styles.halo} />
            <View style={styles.slipBack} />
            <View style={styles.slip}>
              <View style={styles.slipHeading}>
                <Ionicons name="flask" size={20} color={AppColors.navy} />
                <View style={styles.slipTitleLine} />
              </View>
              <View style={styles.slipDivider} />
              <View style={styles.slipRow}>
                <Ionicons name="person-outline" size={14} color={AppColors.textMuted} />
                <View style={styles.slipLine} />
              </View>
              <View style={styles.slipRow}>
                <Ionicons name="cube-outline" size={14} color={AppColors.textMuted} />
                <View style={[styles.slipLine, styles.shortLine]} />
              </View>
              <View style={styles.slipRow}>
                <Ionicons name="calendar-outline" size={14} color={AppColors.textMuted} />
                <View style={styles.slipLine} />
              </View>
            </View>
            <View style={styles.equipmentBadge}>
              <Ionicons name="cube-outline" size={26} color={AppColors.navy} />
            </View>
            <View style={styles.addBadge}>
              <Ionicons name="add" size={24} color={AppColors.white} />
            </View>
          </View>

          <Text style={styles.title}>Ready for the next lab?</Text>
          <Text style={styles.description}>
            Keep equipment, borrowers, and return dates together in one guided form.
          </Text>

          <View style={styles.process}>
            <Text style={styles.processTitle}>FOUR STEPS. ONE ORGANIZED LOAN.</Text>
            <View style={styles.steps}>
              {TRANSACTION_STEPS.map((step) => (
                <View key={step.label} style={styles.step}>
                  <View style={styles.stepIcon}>
                    <Ionicons name={step.icon} size={18} color={AppColors.navy} />
                  </View>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <Button
            title="Add Transaction"
            onPress={handleNewTransaction}
            size="lg"
            icon={<Ionicons name="add" size={22} color={AppColors.white} />}
          />
        </View>

        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={17} color={AppColors.textSecondary} />
          <Text style={styles.hintText}>Have the borrower ID and equipment details ready.</Text>
        </View>
      </ScrollView>
    </TabPageLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 22,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: AppColors.borrowedBg,
  },
  eyebrowDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: AppColors.blue },
  eyebrowText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.micro,
    fontWeight: AppTypography.weight.bold,
    letterSpacing: 1,
    color: AppColors.navy,
  },
  illustration: { height: 150, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  halo: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: AppColors.borrowedBg },
  slipBack: {
    position: 'absolute',
    width: 112,
    height: 128,
    borderRadius: 12,
    backgroundColor: AppColors.headerActionBorder,
    transform: [{ rotate: '-12deg' }, { translateX: -8 }],
  },
  slip: {
    width: 112,
    height: 134,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.white,
    padding: 14,
    transform: [{ rotate: '6deg' }],
  },
  slipHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slipTitleLine: { flex: 1, height: 5, backgroundColor: AppColors.navy, borderRadius: 3 },
  slipDivider: { height: 1, backgroundColor: AppColors.border, marginVertical: 10 },
  slipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  slipLine: { flex: 1, height: 4, backgroundColor: AppColors.border, borderRadius: 2 },
  shortLine: { marginRight: 12 },
  equipmentBadge: {
    position: 'absolute',
    left: '16%',
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
  },
  addBadge: {
    position: 'absolute',
    right: '18%',
    top: 24,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: AppColors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '10deg' }],
  },
  title: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.title,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.navy,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    lineHeight: AppTypography.lineHeight.body,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  process: {
    marginVertical: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AppColors.headerBorder,
  },
  processTitle: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.micro,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.textSecondary,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  steps: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.micro,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.text,
    textAlign: 'center',
  },
  hint: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 6, marginTop: 18, paddingHorizontal: 10 },
  hintText: {
    flexShrink: 1,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    lineHeight: AppTypography.lineHeight.small,
    color: AppColors.textSecondary,
  },
});

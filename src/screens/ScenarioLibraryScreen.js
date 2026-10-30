import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import Header from '../components/Header';
import ScenarioCard from '../components/ScenarioCard';

export default function ScenarioLibraryScreen({
  scenarios = [],
  onSelectScenario,
  onLaunchScenario,
  onToggleFavorite,
  onCreateCustom,
  onBack,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const categories = ['Tất cả', 'Công sở', 'Gia đình', 'Bạn bè', 'Hẹn hò / Tiệc tùng', 'Khẩn cấp', 'Cá nhân'];

  const filteredScenarios = scenarios.filter((sc) => {
    const matchesCategory =
      selectedCategory === 'Tất cả' || sc.category === selectedCategory;

    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      sc.title.toLowerCase().includes(query) ||
      sc.description?.toLowerCase().includes(query) ||
      sc.callerName?.toLowerCase().includes(query) ||
      sc.suggestedMessage?.toLowerCase().includes(query);

    return matchesCategory && matchesQuery;
  });

  return (
    <View style={styles.safeArea}>
      <Header
        title="Thư viện Kịch bản"
        subtitle="Kho kịch bản tình huống thực tế"
        rightAction={onCreateCustom}
        rightLabel="+ Tạo mới"
      />

      <View style={styles.filterSection}>
        {/* Search Input */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm theo sếp, việc gấp, gia đình, shipper..."
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {filteredScenarios.length > 0 ? (
          filteredScenarios.map((sc) => (
            <ScenarioCard
              key={sc.id}
              scenario={sc}
              onSelect={() => onSelectScenario(sc)}
              onLaunch={() => onLaunchScenario(sc)}
              onToggleFavorite={() => onToggleFavorite(sc.id)}
            />
          ))
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Không tìm thấy kịch bản phù hợp</Text>
            <Text style={styles.emptySub}>
              Thử tìm kiếm với từ khóa khác hoặc dùng Trợ lý AI để tự tạo kịch bản mới.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
  },
  clearSearch: {
    color: colors.textMuted,
    fontSize: 16,
    paddingHorizontal: 4,
  },
  pillsScroll: {
    marginBottom: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.bgCard,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs,
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});


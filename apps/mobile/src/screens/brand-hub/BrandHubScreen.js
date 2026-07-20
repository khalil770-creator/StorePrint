import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery }    from '@tanstack/react-query';
import AppHeader       from '../../components/common/AppHeader';
import EmptyState      from '../../components/common/EmptyState';
import { colors, typography, radius, shadow, fonts } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../constants/config';
import client          from '../../api/client';

// ─── File type icon + tint ────────────────────────────────────────────────────

const FILE_META = (ext) => {
  const e = (ext || '').toLowerCase();
  if (e === 'pdf')                          return { icon: '📄', bg: '#FFF0F0', fg: '#C0021B' };
  if (['png','jpg','jpeg','gif','webp'].includes(e)) return { icon: '🖼️', bg: '#EEF4FF', fg: '#1E40AF' };
  if (['psd','ai','eps','svg','ase'].includes(e))    return { icon: '🎨', bg: '#F3EEFF', fg: '#7C3AED' };
  if (['doc','docx'].includes(e))           return { icon: '📝', bg: '#E8F5E9', fg: '#2E7D32' };
  if (['ppt','pptx'].includes(e))           return { icon: '📊', bg: '#FFF8E1', fg: '#F57F17' };
  if (['zip','rar'].includes(e))            return { icon: '🗜️', bg: '#F3F4F6', fg: '#374151' };
  return                                           { icon: '📁', bg: '#F3F4F6', fg: '#374151' };
};

function fmtBytes(b) {
  if (!b) return '';
  if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({ cat, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.catCard, active && styles.catCardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.catIcon}>{cat.icon || '📁'}</Text>
      <Text style={[styles.catLabel, active && { color: colors.primary }]} numberOfLines={1}>
        {cat.name}
      </Text>
      <Text style={styles.catCount}>{cat.asset_count ?? 0} files</Text>
    </TouchableOpacity>
  );
}

// ─── Asset Row ────────────────────────────────────────────────────────────────

function AssetRow({ asset, onDownload }) {
  const { icon, bg, fg } = FILE_META(asset.extension);
  const parts = [
    asset.extension?.toUpperCase(),
    asset.file_size ? fmtBytes(asset.file_size) : null,
    asset.created_at ? fmtDate(asset.created_at) : null,
  ].filter(Boolean);

  return (
    <View style={styles.assetRow}>
      <View style={[styles.assetIconWrap, { backgroundColor: bg }]}>
        <Text style={styles.assetIconText}>{icon}</Text>
      </View>
      <View style={styles.assetInfo}>
        <Text style={styles.assetName} numberOfLines={1}>{asset.name}</Text>
        <Text style={styles.assetMeta}>{parts.join('  ·  ')}</Text>
      </View>
      <TouchableOpacity style={styles.dlBtn} onPress={() => onDownload(asset)} activeOpacity={0.8}>
        <Text style={styles.dlBtnText}>{asset.source === 'link' ? '↗' : '↓'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BrandHubScreen() {
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch]       = useState('');

  const { data: catsRaw, isLoading: loadingCats } = useQuery({
    queryKey: ['bh-categories'],
    queryFn:  () => client.get('/brand-hub/categories').then(r => r.data),
  });
  const categories = Array.isArray(catsRaw) ? catsRaw : [];

  const { data: assetsRaw, isLoading: loadingAssets } = useQuery({
    queryKey: ['bh-assets', activeCat, search],
    queryFn:  () => client.get('/brand-hub/assets', {
      params: { category_id: activeCat || undefined, search: search.trim() || undefined },
    }).then(r => r.data),
  });
  const assets      = assetsRaw?.data || (Array.isArray(assetsRaw) ? assetsRaw : []);
  const totalAssets = assetsRaw?.total ?? assets.length;

  const handleDownload = async (asset) => {
    try {
      const token = useAuthStore.getState().accessToken;
      const url = `${API_BASE_URL}/brand-hub/assets/${asset.id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot open', 'Unable to open this file on your device.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open download link.');
    }
  };

  const activeCatObj = categories.find(c => c.id === activeCat);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader subtitle="Brand Identity Hub" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero Banner ── */}
        <View style={styles.banner}>
          {/* Sparkle decorations */}
          <Text style={styles.sparkle1}>✦</Text>
          <Text style={styles.sparkle2}>✦</Text>
          <Text style={styles.sparkle3}>✦</Text>
          <Text style={styles.bannerTitle}>Brand Identity Hub</Text>
          <Text style={styles.bannerSub}>
            Access official logos, color palettes, and retail guidelines for StorePrint.
          </Text>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search brand assets (e.g. Logo, PDF)"
            placeholderTextColor={colors.lightGrey}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <View style={styles.filterBtn}>
            <Text style={styles.filterIcon}>⊟</Text>
          </View>
        </View>

        {/* ── Categories ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => setActiveCat(null)}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {loadingCats && <ActivityIndicator color={colors.primary} style={{ marginBottom: 16 }} />}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {categories.map(cat => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              active={activeCat === cat.id}
              onPress={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
            />
          ))}
          {categories.length === 0 && !loadingCats && (
            <Text style={styles.emptyNote}>No categories yet.</Text>
          )}
        </ScrollView>

        {/* ── All Assets ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {activeCatObj ? `${activeCatObj.icon || ''} ${activeCatObj.name}` : 'All Assets'}
          </Text>
        </View>

        {loadingAssets && <ActivityIndicator color={colors.primary} style={{ marginTop: 8, marginBottom: 16 }} />}

        {!loadingAssets && assets.length === 0 && (
          <EmptyState
            icon="📂"
            title="No assets found"
            message={search ? `No results for "${search}"` : 'No files in this category yet.'}
          />
        )}

        {assets.map(asset => (
          <AssetRow key={asset.id} asset={asset} onDownload={handleDownload} />
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },

  // Hero banner — emerald green with sparkles
  banner: {
    backgroundColor: colors.emerald,
    borderRadius: radius.lg,
    padding: 24,
    marginTop: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bannerTitle: {
    fontSize: typography.xxl,
    fontWeight: '800',
    color: colors.white,
    fontFamily: fonts.headline,
    marginBottom: 8,
    zIndex: 1,
  },
  bannerSub: {
    fontSize: typography.md,
    color: 'rgba(255,255,255,0.90)',
    fontFamily: fonts.body,
    lineHeight: 22,
    maxWidth: '80%',
  },
  sparkle1: {
    position: 'absolute', right: 24, top: 20,
    fontSize: 36, color: 'rgba(255,255,255,0.30)',
  },
  sparkle2: {
    position: 'absolute', right: 56, top: 50,
    fontSize: 20, color: 'rgba(255,255,255,0.20)',
  },
  sparkle3: {
    position: 'absolute', right: 32, bottom: 16,
    fontSize: 24, color: 'rgba(255,255,255,0.20)',
  },

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 4,
    marginBottom: 20,
    ...shadow.sm,
  },
  searchIcon:  { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, height: 44, fontSize: typography.md, color: colors.dark, fontFamily: fonts.body },
  filterBtn:   { paddingLeft: 10, paddingVertical: 4 },
  filterIcon:  { fontSize: 20, color: colors.midGrey },

  // Section header row
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: typography.lg, fontWeight: '700',
    color: colors.dark, fontFamily: fonts.headlineMd,
  },
  viewAll: {
    fontSize: typography.md, fontWeight: '600',
    color: colors.primary, fontFamily: fonts.label,
  },
  emptyNote: { fontSize: typography.sm, color: colors.lightGrey },

  // Category cards
  catRow: { paddingBottom: 8, gap: 10, marginBottom: 20 },
  catCard: {
    width: 110,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border,
    ...shadow.sm,
  },
  catCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryBg,
  },
  catIcon:  { fontSize: 30, marginBottom: 8 },
  catLabel: {
    fontSize: 13, fontWeight: '700',
    color: colors.dark, fontFamily: fonts.label,
    textAlign: 'center',
  },
  catCount: {
    fontSize: 11, color: colors.midGrey,
    fontFamily: fonts.body, marginTop: 3,
  },

  // Asset rows
  assetRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 10,
    ...shadow.sm,
  },
  assetIconWrap: {
    width: 44, height: 44,
    borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  assetIconText: { fontSize: 22 },
  assetInfo:     { flex: 1 },
  assetName: {
    fontSize: typography.md, fontWeight: '700',
    color: colors.dark, fontFamily: fonts.label,
    marginBottom: 3,
  },
  assetMeta: {
    fontSize: 11, color: colors.midGrey,
    fontFamily: fonts.mono,
  },
  dlBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.emerald,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  dlBtnText: {
    fontSize: 18, color: colors.white, fontWeight: '700', lineHeight: 22,
  },
});

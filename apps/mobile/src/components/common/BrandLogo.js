import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

// Mosaic grid fallback — shown only if logo.png not found
function MosaicIcon({ size = 32 }) {
  const cell = size / 4;
  const gap  = cell * 0.18;
  const s    = cell - gap * 2;
  const grid = [
    [true, true, true],
    [true, false, true],
    [true, true, true],
  ];
  return (
    <View style={{ flexDirection: 'column' }}>
      {grid.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', marginBottom: gap }}>
          {row.map((filled, c) => (
            <View key={c} style={{
              width: s, height: s, marginRight: gap,
              borderRadius: 2,
              backgroundColor: filled ? colors.primary : 'transparent',
            }} />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * BrandLogo
 * Shows the Ideas company logo (PNG) above or beside the StorePrint app name.
 *
 * Props:
 *  size        — 'sm' | 'md' | 'lg' | 'xl'
 *  showAppName — show "StorePrint" text below the logo (default true)
 *  horizontal  — logo + app name side by side (default false)
 */
export default function BrandLogo({ size = 'md', showAppName = true, horizontal = false }) {
  const sizeMap    = { sm: 32, md: 48, lg: 64, xl: 80 };
  const logoH      = sizeMap[size] || sizeMap.md;
  const logoW      = logoH * 3.2;   // Ideas logo is approx 3.2:1 aspect ratio
  const appFontSize = { sm: 18, md: 22, lg: 28, xl: 34 }[size] || 22;

  return (
    <View style={[styles.wrap, horizontal && styles.horizontal]}>
      {/* Ideas logo PNG */}
      <Image
        source={require('../../../assets/logo.png')}
        style={{ width: logoW, height: logoH, resizeMode: 'contain' }}
      />

      {/* StorePrint app name */}
      {showAppName && (
        <Text style={[
          styles.appName,
          { fontSize: appFontSize,
            marginTop: horizontal ? 0 : 8,
            marginLeft: horizontal ? 12 : 0 },
        ]}>
          Store<Text style={styles.appNameBold}>Print</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:        { alignItems: 'center' },
  horizontal:  { flexDirection: 'row', alignItems: 'center' },
  appName:     { color: colors.dark, fontWeight: '700', letterSpacing: -0.3 },
  appNameBold: { color: colors.primary, fontWeight: '800' },
});

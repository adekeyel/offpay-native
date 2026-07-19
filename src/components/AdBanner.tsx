import React, { useEffect, useState } from 'react';
import { View, Image, Text, Pressable, ScrollView, StyleSheet, Linking } from 'react-native';
import * as adsApi from '../api/ads';
import { ASSET_BASE_URL } from '../api/client';
import { colors, spacing, radius, fontSizes } from '../theme/colors';

/**
 * Renders whatever ads the admin has configured for this page/position slot
 * (see GET /api/ads on the backend). Renders nothing at all — no placeholder,
 * no empty space — if there are no active ads for this slot, so pages that
 * never got ads configured look exactly as if this component weren't there.
 */
export default function AdBanner({ page, position = 'middle' }: { page: string; position?: 'top' | 'middle' | 'bottom' }) {
  const [ads, setAds] = useState<adsApi.Ad[]>([]);

  useEffect(() => {
    adsApi.getAds(page, position).then((res) => setAds(res.data)).catch(() => {});
  }, [page, position]);

  if (!ads.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
    >
      {ads.map((ad) => (
        <Pressable
          key={ad.id}
          style={styles.card}
          onPress={() => ad.link_url && Linking.openURL(ad.link_url)}
          disabled={!ad.link_url}
        >
          {ad.media_type === 'image' ? (
            <Image source={{ uri: `${ASSET_BASE_URL}${ad.media_url}` }} style={styles.media} resizeMode="cover" />
          ) : (
            // Video ads render as a labeled placeholder for now — the home feed
            // isn't the right place for an autoplaying <Video>; tapping still
            // opens link_url like any other ad.
            <View style={[styles.media, styles.videoPlaceholder]}>
              <Text style={styles.videoLabel}>▶ {ad.title}</Text>
            </View>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const CARD_WIDTH = 280;

const styles = StyleSheet.create({
  container: { marginTop: spacing.lg },
  card: {
    width: CARD_WIDTH,
    height: 120,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  media: { width: '100%', height: '100%' },
  videoPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink700 },
  videoLabel: { color: colors.white, fontSize: fontSizes.sm, fontWeight: '600' },
});

import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Text, Pressable, StyleSheet, Linking } from 'react-native';
import * as adsApi from '../api/ads';
import { ASSET_BASE_URL } from '../api/client';
import { colors, spacing, radius, fontSizes } from '../theme/colors';

const ROTATE_INTERVAL_MS = 20000;

/**
 * Renders whatever ads the admin has configured for this page/position slot
 * (see GET /api/ads on the backend). Renders nothing at all — no placeholder,
 * no empty space — if there are no active ads for this slot, so pages that
 * never got ads configured look exactly as if this component weren't there.
 *
 * Shows one ad at a time, auto-advancing to the next every 20 seconds and
 * wrapping back to the first after the last — this is deliberately NOT a
 * side-by-side swipeable strip.
 */
export default function AdBanner({ page, position = 'middle' }: { page: string; position?: 'top' | 'middle' | 'bottom' }) {
  const [ads, setAds] = useState<adsApi.Ad[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    adsApi.getAds(page, position).then((res) => setAds(res.data)).catch(() => {});
  }, [page, position]);

  useEffect(() => {
    setIndex(0);
    if (ads.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [ads]);

  if (!ads.length) return null;
  const ad = ads[index];

  // A media_url can either be a full external URL (e.g. Cloudinary —
  // https://res.cloudinary.com/...) or a relative path served by our own
  // backend's /uploads route. Only the latter needs ASSET_BASE_URL prefixed
  // — prefixing an already-absolute URL produces a broken, unloadable one,
  // which is why Cloudinary-hosted ads weren't showing at all.
  const mediaUri = /^https?:\/\//i.test(ad.media_url) ? ad.media_url : `${ASSET_BASE_URL}${ad.media_url}`;

  return (
    <View style={styles.container}>
      <Pressable
        key={ad.id}
        style={styles.card}
        onPress={() => ad.link_url && Linking.openURL(ad.link_url)}
        disabled={!ad.link_url}
      >
        {ad.media_type === 'image' ? (
          <Image source={{ uri: mediaUri }} style={styles.media} resizeMode="cover" />
        ) : (
          // Video ads render as a labeled placeholder for now — the home feed
          // isn't the right place for an autoplaying <Video>; tapping still
          // opens link_url like any other ad.
          <View style={[styles.media, styles.videoPlaceholder]}>
            <Text style={styles.videoLabel}>▶ {ad.title}</Text>
          </View>
        )}
      </Pressable>
      {ads.length > 1 && (
        <View style={styles.dots}>
          {ads.map((a, i) => (
            <View key={a.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  card: {
    width: '100%',
    height: 120,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  media: { width: '100%', height: '100%' },
  videoPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink700 },
  videoLabel: { color: colors.white, fontSize: fontSizes.sm, fontWeight: '600' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.ink },
});

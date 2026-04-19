import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getPublicSettingsApi } from '@/lib/api';
import { SkeletonRow } from '@/components/ui/Skeleton';

interface Settings {
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  [key: string]: unknown;
}

export default function ContactScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-settings'],
    queryFn: getPublicSettingsApi,
  });

  const settings = data as Settings | undefined;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Contact Us</Text>

      {isLoading && (
        <>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </>
      )}

      {error && (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>
            Contact us at{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('mailto:info@gulflimo.com')}
            >
              info@gulflimo.com
            </Text>
          </Text>
        </View>
      )}

      {!isLoading && !error && settings && (
        <View style={styles.card}>
          {settings.phone && (
            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL(`tel:${settings.phone}`)}
            >
              <Text style={styles.icon}>📞</Text>
              <View>
                <Text style={styles.rowLabel}>Phone</Text>
                <Text style={styles.rowValue}>{settings.phone}</Text>
              </View>
            </TouchableOpacity>
          )}
          {settings.email && (
            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL(`mailto:${settings.email}`)}
            >
              <Text style={styles.icon}>✉️</Text>
              <View>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>{settings.email}</Text>
              </View>
            </TouchableOpacity>
          )}
          {settings.whatsapp && (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                Linking.openURL(`https://wa.me/${settings.whatsapp?.replace(/\D/g, '')}`)
              }
            >
              <Text style={styles.icon}>💬</Text>
              <View>
                <Text style={styles.rowLabel}>WhatsApp</Text>
                <Text style={styles.rowValue}>{settings.whatsapp}</Text>
              </View>
            </TouchableOpacity>
          )}
          {settings.address && (
            <View style={styles.row}>
              <Text style={styles.icon}>📍</Text>
              <View>
                <Text style={styles.rowLabel}>Address</Text>
                <Text style={styles.rowValue}>{settings.address}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#121A2B',
    borderColor: '#1E2940',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomColor: '#1E2940',
    borderBottomWidth: 1,
    gap: 12,
  },
  icon: {
    fontSize: 20,
  },
  rowLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 2,
  },
  rowValue: {
    color: '#F8FAFC',
    fontSize: 15,
  },
  fallback: {
    backgroundColor: '#121A2B',
    borderRadius: 16,
    padding: 20,
  },
  fallbackText: {
    color: '#F8FAFC',
    fontSize: 15,
  },
  link: {
    color: '#38BDF8',
    textDecorationLine: 'underline',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useGeoSearch } from '@/hooks/useGeoSearch';
import type { GeoResult } from '@/types';

interface GeoSearchInputProps {
  label: string;
  value: string;
  onSelect: (result: GeoResult) => void;
  placeholder?: string;
}

export default function GeoSearchInput({
  label,
  value,
  onSelect,
  placeholder,
}: GeoSearchInputProps) {
  const { results, loading, search, clear } = useGeoSearch();
  const [text, setText] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleChange = (val: string) => {
    setText(val);
    setShowDropdown(true);
    search(val);
  };

  const handleSelect = (result: GeoResult) => {
    setText(result.display_name);
    setShowDropdown(false);
    clear();
    onSelect(result);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={text}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={styles.input}
        onBlur={() => {
          setTimeout(() => setShowDropdown(false), 200);
        }}
      />
      {showDropdown && Array.isArray(results) && results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={Array.isArray(results) ? results.slice(0, 5) : []}
            keyExtractor={(item, idx) => `${item.lat}-${item.lon}-${idx}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.dropdownText} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </View>
      )}
      {loading && (
        <Text style={styles.loadingText}>Searching...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
    zIndex: 999,
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#121A2B',
    borderColor: '#2A3A57',
    borderWidth: 1,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
    color: '#F8FAFC',
    fontSize: 16,
  },
  dropdown: {
    position: Platform.OS === 'web' ? ('absolute' as never) : 'absolute',
    top: 82,
    left: 0,
    right: 0,
    backgroundColor: '#1E2940',
    borderColor: '#2A3A57',
    borderWidth: 1,
    borderRadius: 14,
    zIndex: 1000,
    maxHeight: 220,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomColor: '#2A3A57',
    borderBottomWidth: 1,
  },
  dropdownText: {
    color: '#F8FAFC',
    fontSize: 13,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  rightElement,
  containerStyle,
  multiline,
  numberOfLines,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.focused,
          error ? styles.errorBorder : null,
          multiline ? { height: undefined, minHeight: 80 } : null,
        ]}
      >
        <TextInput
          {...props}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            styles.input,
            multiline ? styles.multilineInput : null,
          ]}
          placeholderTextColor="#6b6b6b"
        />
        {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    color: '#6b6b6b',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
  },
  focused: {
    borderColor: '#C9A84C',
  },
  errorBorder: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    color: '#F5F0E8',
    fontSize: 15,
    height: '100%',
  },
  multilineInput: {
    height: undefined,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: 'top',
  },
  right: {
    marginLeft: 8,
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});

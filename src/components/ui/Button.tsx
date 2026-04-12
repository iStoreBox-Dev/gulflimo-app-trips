import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TouchableOpacityProps,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
}

const BG: Record<Variant, string> = {
  primary: '#C9A84C',
  secondary: 'transparent',
  ghost: 'transparent',
  danger: '#EF4444',
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: '#0a0a0a',
  secondary: '#C9A84C',
  ghost: '#F5F0E8',
  danger: '#FFFFFF',
};

const BORDER_COLOR: Record<Variant, string | undefined> = {
  primary: undefined,
  secondary: '#C9A84C',
  ghost: undefined,
  danger: undefined,
};

const HEIGHT: Record<Size, number> = {
  sm: 36,
  md: 44,
  lg: 52,
};

const FONT_SIZE: Record<Size, number> = {
  sm: 13,
  md: 15,
  lg: 17,
};

export default function Button({
  label,
  loading,
  disabled,
  variant = 'primary',
  size = 'md',
  onPress,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          backgroundColor: BG[variant],
          borderColor: BORDER_COLOR[variant],
          borderWidth: BORDER_COLOR[variant] ? 1.5 : 0,
          height: HEIGHT[size],
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={TEXT_COLOR[variant]} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            { color: TEXT_COLOR[variant], fontSize: FONT_SIZE[size] },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

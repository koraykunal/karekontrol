import React from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TouchableOpacityProps
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

interface Props extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    fullWidth?: boolean;
}

export function Button({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    fullWidth = false,
    style,
    disabled,
    ...props
}: Props) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const getBackgroundColor = () => {
        if (disabled) return theme.border;
        switch (variant) {
            case 'primary': return theme.primary;
            case 'secondary': return theme.secondary;
            case 'danger': return theme.error;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return theme.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.textMuted;
        switch (variant) {
            case 'primary':
            case 'secondary':
            case 'danger':
                return '#fff';
            case 'outline': return theme.primary;
            case 'ghost': return theme.textSecondary;
            default: return '#fff';
        }
    };

    const getBorderColor = () => {
        if (disabled) return 'transparent';
        if (variant === 'outline') return theme.primary;
        return 'transparent';
    };

    const getPadding = () => {
        switch (size) {
            case 'sm': return { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md };
            case 'md': return { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg };
            case 'lg': return { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl };
        }
    };

    const containerStyle: ViewStyle = {
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor(),
        borderWidth: variant === 'outline' ? 1 : 0,
        borderRadius: BorderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled || loading ? 0.7 : 1,
        width: fullWidth ? '100%' : undefined,
        ...getPadding(),
        ...(style as object),
    };

    return (
        <TouchableOpacity
            style={containerStyle}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <>
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={size === 'sm' ? 16 : 20}
                            color={getTextColor()}
                            style={{ marginRight: 8 }}
                        />
                    )}
                    <Text
                        variant={size === 'sm' ? 'bodySmall' : 'body'}
                        weight="600"
                        color={getTextColor()}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

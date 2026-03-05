import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { Colors, Shadows, BorderRadius, Spacing } from '../../constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props extends ViewProps {
    variant?: 'elevated' | 'outlined' | 'flat';
    noPadding?: boolean;
}

export function Card({
    variant = 'elevated',
    noPadding = false,
    style,
    children,
    ...props
}: Props) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const getStyles = () => {
        const baseStyle = {
            backgroundColor: theme.cardBackground,
            borderRadius: BorderRadius.lg,
            padding: noPadding ? 0 : Spacing.lg,
        };

        switch (variant) {
            case 'elevated':
                return {
                    ...baseStyle,
                    ...Shadows.sm,
                };
            case 'outlined':
                return {
                    ...baseStyle,
                    borderWidth: 1,
                    borderColor: theme.border,
                };
            case 'flat':
                return baseStyle;
            default:
                return baseStyle;
        }
    };

    return (
        <View style={[getStyles(), style]} {...props}>
            {children}
        </View>
    );
}

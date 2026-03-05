import React from 'react';
import { Text as RNText, StyleSheet, TextProps, TextStyle } from 'react-native';
import { Colors, Typography } from '../../constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

interface Props extends TextProps {
    variant?: keyof typeof Typography;
    color?: string;
    weight?: 'normal' | 'bold' | '600' | '500';
    align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export function Text({
    style,
    variant = 'body',
    color,
    weight,
    align,
    children,
    ...props
}: Props) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const textStyle: TextStyle[] = [
        Typography[variant] as TextStyle,
        { color: color || theme.text },
        weight ? { fontWeight: weight } : {},
        align ? { textAlign: align } : {},
        style as TextStyle,
    ].filter(Boolean) as TextStyle[];

    return (
        <RNText style={textStyle} {...props}>
            {children}
        </RNText>
    );
}

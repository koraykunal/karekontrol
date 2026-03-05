import React from 'react';
import {
    TextInput,
    View,
    StyleSheet,
    TextInputProps,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

interface Props extends TextInputProps {
    label?: string;
    error?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
}

export function Input({
    label,
    error,
    icon,
    rightIcon,
    onRightIconPress,
    style,
    ...props
}: Props) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <View style={styles.container}>
            {label && <Text variant="bodySmall" weight="500" style={styles.label}>{label}</Text>}

            <View style={[
                styles.inputContainer,
                {
                    backgroundColor: theme.inputBackground,
                    borderColor: error ? theme.error : theme.border,
                }
            ]}>
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={theme.textSecondary}
                        style={styles.icon}
                    />
                )}

                <TextInput
                    style={[
                        styles.input,
                        { color: theme.text },
                        icon && { paddingLeft: 0 }, // If icon is present, remove left padding
                        style
                    ]}
                    placeholderTextColor={theme.textMuted}
                    {...props}
                />

                {rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress}>
                        <Ionicons
                            name={rightIcon}
                            size={20}
                            color={theme.textSecondary}
                            style={styles.rightIcon}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error && (
                <Text variant="caption" color={theme.error} style={styles.errorText}>
                    {error}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        marginBottom: Spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        height: 48,
    },
    input: {
        flex: 1,
        height: '100%',
        ...Typography.body,
    },
    icon: {
        marginRight: Spacing.sm,
    },
    rightIcon: {
        marginLeft: Spacing.sm,
    },
    errorText: {
        marginTop: Spacing.xs,
    },
});

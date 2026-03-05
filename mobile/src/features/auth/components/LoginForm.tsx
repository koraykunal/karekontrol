import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/src/features/auth/schemas/auth.schema';
import { Colors } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

interface LoginFormProps {
    onSubmit: (data: LoginFormData) => Promise<void>;
    isLoading: boolean;
    errorMessage?: string;
}

export function LoginForm({ onSubmit, isLoading, errorMessage }: LoginFormProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    return (
        <>
            <Text style={[styles.title, { color: theme.text }]}>KareKontrol</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Giriş Yap</Text>

            {errorMessage ? (
                <View style={[styles.errorContainer, { backgroundColor: theme.errorLight, borderLeftColor: theme.error }]}>
                    <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
                </View>
            ) : null}

            <View style={styles.form}>
                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                                    errors.email && { borderColor: theme.error }
                                ]}
                                placeholder="ornek@email.com"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                editable={!isLoading}
                            />
                            {errors.email && (
                                <Text style={[styles.inputErrorText, { color: theme.error }]}>{errors.email.message}</Text>
                            )}
                        </View>
                    )}
                />

                <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>Şifre</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                                    errors.password && { borderColor: theme.error }
                                ]}
                                placeholder="••••••••"
                                placeholderTextColor={theme.textMuted}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                editable={!isLoading}
                            />
                            {errors.password && (
                                <Text style={[styles.inputErrorText, { color: theme.error }]}>{errors.password.message}</Text>
                            )}
                        </View>
                    )}
                />

                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: theme.primary },
                        isLoading && { opacity: 0.6 }
                    ]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={theme.background} />
                    ) : (
                        <Text style={[styles.buttonText, { color: theme.background }]}>Giriş Yap</Text>
                    )}
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 32,
    },
    errorContainer: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
    },
    errorText: {
        fontSize: 14,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    inputErrorText: {
        fontSize: 12,
    },
    button: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useLogin } from '@/src/store/react-query/hooks/use-auth';
import { LoginForm } from '@/src/features/auth/components/LoginForm';
import { LoginFormData } from '@/src/features/auth/schemas/auth.schema';
import { handleApiError } from '@/src/api/client/error-handler';
import { Colors } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

export default function LoginRoute() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { mutateAsync: loginAsync, isPending: isLoading } = useLogin();
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (data: LoginFormData) => {
        setErrorMessage('');

        try {
            await loginAsync(data);
            router.replace('/(main)/(tabs)/(dashboard)');
        } catch (error) {
            const apiError = handleApiError(error);
            setErrorMessage(apiError.message);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
        >
            <View style={styles.content}>
                <LoginForm
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    errorMessage={errorMessage}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
});

import React from 'react';
import { View, StyleSheet, ViewProps, SafeAreaView } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StatusBar } from 'expo-status-bar';

interface Props extends ViewProps {
    safeArea?: boolean;
    padding?: boolean;
    center?: boolean;
}

export function Screen({
    safeArea = true,
    padding = true,
    center = false,
    style,
    children,
    ...props
}: Props) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const Container = safeArea ? SafeAreaView : View;

    return (
        <Container
            style={[
                styles.container,
                { backgroundColor: theme.backgroundSecondary },
                center && styles.center,
                style
            ]}
            {...props}
        >
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <View style={[
                styles.content,
                padding && { padding: Spacing.lg },
                center && styles.center,
            ]}>
                {children}
            </View>
        </Container>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { QRScanner } from '@/src/features/scanner';
import { DashboardEntityList, QuickActions } from '@/src/features/dashboard';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

export default function DashboardRoute() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { height } = useWindowDimensions();
    const cameraHeight = height * 0.45;

    const handleProceduresPress = () => router.push('/(main)/execution');
    const handleEntitiesPress = () => router.push('/(main)/(entities)');
    const handleIssuesPress = () => router.push('/(main)/(issues)' as any);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <QRScanner height={cameraHeight} />

            <View style={[styles.contentContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <QuickActions
                    onProceduresPress={handleProceduresPress}
                    onEntitiesPress={handleEntitiesPress}
                    onIssuesPress={handleIssuesPress}
                />
                <DashboardEntityList />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        marginTop: -24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        paddingTop: Spacing.sm,
    },
});

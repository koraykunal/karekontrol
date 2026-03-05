import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/src/components/common/Screen';
import { Text } from '@/src/components/common/Text';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { usePermissions } from '@/src/features/management';

interface ManagementCardProps {
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color: string;
}

function ManagementCard({ title, description, icon, onPress, color }: ManagementCardProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <Card style={styles.card}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={28} color={color} />
                </View>
                <View style={styles.cardContent}>
                    <Text variant="h3" style={styles.cardTitle}>{title}</Text>
                    <Text variant="bodySmall" color={theme.textSecondary}>{description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </Card>
        </TouchableOpacity>
    );
}

export default function ManagementHomeScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { canManage, canManageUsers, isAdmin, isManager } = usePermissions();

    // Redirect if user doesn't have management permissions
    if (!canManage) {
        return <Redirect href="/(main)/(tabs)/(dashboard)" />;
    }

    return (
        <Screen padding={false} style={{ backgroundColor: theme.backgroundSecondary }}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="h2">Yönetim Paneli</Text>
                    <Text variant="body" color={theme.textSecondary}>
                        {isAdmin ? 'Yönetici' : 'Departman Yöneticisi'} olarak giriş yaptınız
                    </Text>
                </View>

                {/* Management Cards */}
                <View style={styles.cardsContainer}>
                    <ManagementCard
                        title="Varlık Yönetimi"
                        description="Varlıkları görüntüle, düzenle ve yönet"
                        icon="cube-outline"
                        color={theme.primary}
                        onPress={() => router.push('/(main)/(tabs)/(management)/entities')}
                    />

                    <ManagementCard
                        title="Prosedür Yönetimi"
                        description="Prosedürleri ve adımlarını düzenle"
                        icon="clipboard-outline"
                        color="#10B981"
                        onPress={() => router.push('/(main)/(tabs)/(management)/procedures')}
                    />

                    {canManageUsers && (
                        <ManagementCard
                            title="Kullanıcı Yönetimi"
                            description={isAdmin ? "Kullanıcıları ve rollerini yönet" : "Departman kullanıcılarını görüntüle"}
                            icon="people-outline"
                            color="#8B5CF6"
                            onPress={() => router.push('/(main)/(tabs)/(management)/users')}
                        />
                    )}

                    {(isAdmin || isManager) && (
                        <ManagementCard
                            title="İzin Yönetimi"
                            description="Rol bazlı izinleri yapılandır"
                            icon="shield-checkmark-outline"
                            color="#F59E0B"
                            onPress={() => router.push('/(main)/(tabs)/(management)/permissions')}
                        />
                    )}

                    <ManagementCard
                        title="Rapor Yönetimi"
                        description="Raporları görüntüle, indir ve paylaş"
                        icon="document-text-outline"
                        color="#6366F1"
                        onPress={() => router.push('/(main)/(reports)')}
                    />
                </View>

                {/* Quick Stats */}
                <View style={styles.statsSection}>
                    <Text variant="h3" style={styles.sectionTitle}>Hızlı Bilgiler</Text>
                    <View style={[styles.statsCard, { backgroundColor: theme.background }]}>
                        <Text variant="caption" color={theme.textSecondary}>
                            {isAdmin
                                ? 'Organizasyondaki tüm varlık ve prosedürleri yönetebilirsiniz.'
                                : 'Sadece kendi departmanınızdaki varlık ve prosedürleri düzenleyebilirsiniz.'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.md,
        paddingBottom: 40,
    },
    header: {
        marginBottom: Spacing.xl,
    },
    cardsContainer: {
        gap: Spacing.md,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        marginBottom: 4,
    },
    statsSection: {
        marginTop: Spacing.xl,
    },
    sectionTitle: {
        marginBottom: Spacing.sm,
    },
    statsCard: {
        padding: Spacing.md,
        borderRadius: 12,
    },
});

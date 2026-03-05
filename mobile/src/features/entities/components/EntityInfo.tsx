import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/src/components/common/Text';
import { Card } from '@/src/components/common/Card';
import { Entity } from '@/src/api/types/entity.types';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface EntityInfoProps {
    entity: Entity;
}

export function EntityInfo({ entity }: EntityInfoProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return theme.success;
            case 'maintenance': return theme.warning;
            case 'inactive': return theme.textMuted;
            default: return theme.primary;
        }
    };

    const getStatusText = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'Aktif';
            case 'maintenance': return 'Bakımda';
            case 'inactive': return 'Pasif';
            default: return status;
        }
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.section}>
            <TouchableOpacity
                onPress={toggleExpand}
                activeOpacity={0.9}
            >
                <Card style={styles.card} noPadding>
                    {/* Compact Header (Always Visible) */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
                                <Ionicons
                                    name={entity.entity_type === 'vehicle' ? 'car' : 'cube'}
                                    size={24}
                                    color={theme.primary}
                                />
                            </View>
                            <View style={styles.titleContainer}>
                                <Text variant="h3" style={{ color: theme.text }}>
                                    {entity.name}
                                </Text>
                                <Text variant="caption" color={theme.textSecondary}>
                                    {entity.code || '-'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.headerRight}>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(entity.status) }]}>
                                <Text style={[styles.statusText, { color: theme.background }]}>
                                    {getStatusText(entity.status)}
                                </Text>
                            </View>
                            <Ionicons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={theme.textSecondary}
                                style={{ marginLeft: 8 }}
                            />
                        </View>
                    </View>

                    {/* Expanded Content */}
                    {isExpanded && (
                        <View style={[styles.content, { borderTopColor: theme.border }]}>
                            {/* Entity Image */}
                            {(() => {
                                const imageUrl = entity.primary_image?.image || entity.primary_image_url;
                                return imageUrl ? (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.entityImage}
                                        resizeMode="cover"
                                    />
                                ) : null;
                            })()}

                            {/* Details Grid */}
                            <View style={styles.detailsContainer}>
                                <InfoItem label="Tip" value={entity.entity_type} theme={theme} styles={styles} />
                                <InfoItem label="Konum" value={entity.location} theme={theme} styles={styles} />
                                <InfoItem label="Departman" value={(entity as any).department_name} theme={theme} styles={styles} />
                                {(entity as any).manufacturer && <InfoItem label="Marka" value={(entity as any).manufacturer} theme={theme} styles={styles} />}
                                {(entity as any).model && <InfoItem label="Model" value={(entity as any).model} theme={theme} styles={styles} />}
                                {(entity as any).serial_number && <InfoItem label="Seri No" value={(entity as any).serial_number} theme={theme} styles={styles} />}
                            </View>

                            {entity.description && (
                                <View style={[styles.descriptionContainer, { backgroundColor: theme.backgroundSecondary }]}>
                                    <Text variant="caption" color={theme.textSecondary} style={{ marginBottom: 4, fontWeight: '600' }}>
                                        AÇIKLAMA
                                    </Text>
                                    <Text variant="body" color={theme.text} style={{ fontSize: 13 }}>
                                        {entity.description}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </Card>
            </TouchableOpacity>
        </View>
    );
}

const InfoItem = ({ label, value, theme, styles }: { label: string, value: any, theme: any, styles: any }) => (
    <View style={styles.infoItem}>
        <Text variant="caption" color={theme.textSecondary} style={{ marginBottom: 2 }}>
            {label}
        </Text>
        <Text variant="body" weight="500" color={theme.text}>
            {value || '-'}
        </Text>
    </View>
);

const createStyles = (theme: any) => StyleSheet.create({
    section: {
        paddingHorizontal: Spacing.md,
        marginTop: Spacing.md,
    },
    card: {
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    titleContainer: {
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    content: {
        borderTopWidth: 1,
        padding: Spacing.md,
    },
    entityImage: {
        width: '100%',
        height: 200,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
        backgroundColor: theme.backgroundSecondary,
    },
    detailsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8, // compensate padding
    },
    infoItem: {
        width: '50%', // 2 columns
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    descriptionContainer: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
        marginTop: Spacing.xs,
    },
});

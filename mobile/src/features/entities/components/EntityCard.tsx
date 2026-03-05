import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '@/src/components/common/Card';
import { Text } from '@/src/components/common/Text';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { Entity } from '@/src/api/types/entity.types';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
    entity: Entity;
    onPress: () => void;
    onLongPress?: () => void;
    onScan?: () => void;
}

const getEntityIcon = (type: string | null): keyof typeof MaterialIcons.glyphMap => {
    const typeMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
        machine: 'devices',
        vehicle: 'directions-car',
        equipment: 'engineering',
        tool: 'build',
        facility: 'location-city',
        computer: 'computer',
        monitor: 'monitor',
        phone: 'smartphone',
    };
    return typeMap[type?.toLowerCase() || ''] || 'category';
};

const getStatusColor = (status: string | null): string => {
    switch (status?.toLowerCase()) {
        case 'active':
            return Colors.light.success;
        case 'maintenance':
            return Colors.light.warning;
        case 'inactive':
            return Colors.light.textMuted;
        case 'broken':
            return Colors.light.error;
        default:
            return Colors.light.textSecondary;
    }
};

export function EntityCard({ entity, onPress, onLongPress }: Props) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const hasImage = !!entity.primary_image_url;

    // Explicitly handle colors to ensure visibility
    const nameColor = isDark ? Colors.dark.text : Colors.light.text;
    const codeColor = isDark ? Colors.dark.textSecondary : Colors.light.textSecondary;
    const cardBg = isDark ? Colors.dark.cardBackground : Colors.light.cardBackground;

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress?.();
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            onLongPress={handleLongPress}
            delayLongPress={400}
        >
            <Card variant="elevated" noPadding style={[styles.card, { backgroundColor: cardBg }]}>
                <View style={styles.contentContainer}>
                    {/* Icon or Image Container */}
                    <View style={styles.mediaContainer}>
                        {hasImage ? (
                            <Image
                                source={{ uri: entity.primary_image_url! }}
                                style={styles.image}
                                contentFit="cover"
                                transition={200}
                            />
                        ) : (
                            <View style={[styles.iconPlaceholder, {
                                backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.primaryLight
                            }]}>
                                <MaterialIcons
                                    name={getEntityIcon(entity.entity_type)}
                                    size={24}
                                    color={Colors.light.primary}
                                />
                            </View>
                        )}
                    </View>

                    {/* Content */}
                    <View style={styles.infoContainer}>
                        <Text variant="bodySmall" weight="600" style={{ color: nameColor, marginBottom: 2 }} numberOfLines={1}>
                            {entity.name}
                        </Text>
                        <Text variant="caption" style={{ color: codeColor, marginBottom: 4 }} numberOfLines={1}>
                            {entity.qr_code}
                        </Text>

                        <View style={styles.footer}>
                            <View
                                style={[
                                    styles.statusDot,
                                    { backgroundColor: getStatusColor(entity.status) },
                                ]}
                            />
                            <Text variant="caption" style={{ color: codeColor, fontSize: 11 }} numberOfLines={1}>
                                {entity.entity_type?.toUpperCase() || 'GENERIC'}
                            </Text>
                        </View>

                        {/* Non-compliance indicator */}
                        {entity.open_issue_count != null && entity.open_issue_count > 0 && (
                            <View style={styles.issueIndicator}>
                                <MaterialIcons
                                    name="warning"
                                    size={12}
                                    color="#FFFFFF"
                                />
                                <Text variant="caption" style={styles.issueText}>
                                    {entity.open_issue_count} Uygunsuzluk
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Chevron */}
                    <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color={codeColor}
                        style={styles.chevron}
                    />
                </View>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: Spacing.sm,
        overflow: 'hidden',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    mediaContainer: {
        marginRight: Spacing.md,
    },
    image: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    iconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: BorderRadius.round,
    },
    chevron: {
        marginLeft: Spacing.xs,
    },
    issueIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: Spacing.xs,
        paddingVertical: 3,
        paddingHorizontal: 8,
        backgroundColor: '#E65100',  // Dark orange
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
    },
    issueText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

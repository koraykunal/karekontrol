import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Pressable, Dimensions, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/src/components/common/Text';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { Entity } from '@/src/api/types/entity.types';
import { NonComplianceIssue } from '@/src/api/types/issue.types';
import { IssueSeverity } from '@/src/api/types/enums';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface EntityQuickMenuProps {
    entity: Entity | null;
    issues?: NonComplianceIssue[];
    visible: boolean;
    onClose: () => void;
    onViewDetails: () => void;
    onStartProcedure?: () => void;
    onShowQR?: () => void;
    onIssuePress?: (issue: NonComplianceIssue) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function EntityQuickMenu({
    entity,
    issues = [],
    visible,
    onClose,
    onViewDetails,
    onStartProcedure,
    onShowQR,
    onIssuePress,
}: EntityQuickMenuProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[colorScheme ?? 'light'];

    if (!entity) return null;

    const handleAction = (action: () => void) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
        setTimeout(action, 100);
    };

    const actions = [
        {
            icon: 'eye-outline' as const,
            label: 'Detayları Gör',
            onPress: () => handleAction(onViewDetails),
            color: theme.primary,
        },
        ...(onStartProcedure ? [{
            icon: 'play-circle-outline' as const,
            label: 'Prosedür Başlat',
            onPress: () => handleAction(onStartProcedure),
            color: theme.success,
        }] : []),
        ...(onShowQR ? [{
            icon: 'qr-code-outline' as const,
            label: 'QR Kodu',
            onPress: () => handleAction(onShowQR),
            color: theme.textSecondary,
        }] : []),
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <BlurView
                    intensity={isDark ? 60 : 40}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.blurContainer}
                >
                    <Pressable style={[styles.menuContainer, { backgroundColor: theme.cardBackground }]}>
                        {/* Entity Preview Header */}
                        <View style={styles.previewHeader}>
                            {entity.primary_image_url ? (
                                <Image
                                    source={{ uri: entity.primary_image_url }}
                                    style={styles.previewImage}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={[styles.previewIconPlaceholder, { backgroundColor: theme.primaryLight }]}>
                                    <MaterialIcons name="category" size={32} color={theme.primary} />
                                </View>
                            )}
                            <View style={styles.previewInfo}>
                                <Text variant="h3" numberOfLines={1} style={{ marginBottom: 4 }}>
                                    {entity.name}
                                </Text>
                                <Text variant="caption" color={theme.textSecondary} numberOfLines={1}>
                                    {entity.qr_code}
                                </Text>
                                {entity.location && (
                                    <View style={styles.locationRow}>
                                        <Ionicons name="location-outline" size={12} color={theme.textMuted} />
                                        <Text variant="caption" color={theme.textMuted} numberOfLines={1}>
                                            {entity.location}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Quick Stats */}
                        <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
                            <View style={styles.statItem}>
                                <Text variant="bodySmall" weight="600" color={theme.primary}>
                                    {entity.entity_type?.toUpperCase() || '-'}
                                </Text>
                                <Text variant="caption" color={theme.textSecondary}>Tip</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                            <View style={styles.statItem}>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: entity.status === 'active' ? theme.success : theme.warning }
                                ]}>
                                    <Text variant="caption" color="#fff" weight="600" style={{ fontSize: 10 }}>
                                        {entity.status?.toUpperCase() || 'N/A'}
                                    </Text>
                                </View>
                                <Text variant="caption" color={theme.textSecondary}>Durum</Text>
                            </View>
                        </View>

                        {/* Issues List */}
                        {issues.length > 0 && (
                            <View style={[styles.issuesSection, { borderTopColor: theme.border }]}>
                                <View style={styles.issuesHeader}>
                                    <MaterialIcons name="warning" size={16} color={theme.error} />
                                    <Text variant="bodySmall" weight="600" color={theme.error} style={{ marginLeft: 6 }}>
                                        Açık Uygunsuzluklar ({issues.length})
                                    </Text>
                                </View>
                                <ScrollView style={styles.issuesList} nestedScrollEnabled>
                                    {issues.map((issue) => (
                                        <TouchableOpacity
                                            key={issue.id}
                                            style={[styles.issueItem, { borderBottomColor: theme.border }]}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                onClose();
                                                setTimeout(() => onIssuePress?.(issue), 100);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.issueItemContent}>
                                                <Text variant="bodySmall" weight="500" numberOfLines={1} style={{ flex: 1 }}>
                                                    {issue.title}
                                                </Text>
                                                <View style={[
                                                    styles.severityBadge,
                                                    {
                                                        backgroundColor: issue.severity === IssueSeverity.CRITICAL ? theme.error :
                                                            issue.severity === IssueSeverity.HIGH ? '#F59E0B' : theme.warning
                                                    }
                                                ]}>
                                                    <Text variant="caption" color="#fff" style={{ fontSize: 9 }}>
                                                        {issue.severity?.toUpperCase()}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text variant="caption" color={theme.textMuted} numberOfLines={1}>
                                                {issue.step_title || issue.description?.substring(0, 50)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={[styles.actionsContainer, { borderTopColor: theme.border }]}>
                            {actions.map((action, index) => (
                                <TouchableOpacity
                                    key={action.label}
                                    style={[
                                        styles.actionButton,
                                        index > 0 && { borderLeftWidth: 1, borderLeftColor: theme.border }
                                    ]}
                                    onPress={action.onPress}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name={action.icon} size={24} color={action.color} />
                                    <Text variant="caption" color={theme.text} style={{ marginTop: 4, fontSize: 11 }}>
                                        {action.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Pressable>
                </BlurView>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    blurContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContainer: {
        width: SCREEN_WIDTH - 48,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    previewHeader: {
        flexDirection: 'row',
        padding: Spacing.md,
        alignItems: 'center',
    },
    previewImage: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.md,
    },
    previewIconPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        paddingVertical: Spacing.md,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: '100%',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginBottom: 4,
    },
    actionsContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
    },
    actionButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    issuesSection: {
        borderTopWidth: 1,
        paddingVertical: Spacing.sm,
    },
    issuesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.xs,
    },
    issuesList: {
        maxHeight: 150,
    },
    issueItem: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    issueItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    severityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
});

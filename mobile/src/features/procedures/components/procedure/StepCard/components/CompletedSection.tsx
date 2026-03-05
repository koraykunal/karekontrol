import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text } from '@/src/components/common/Text';
import { createStyles } from '../styles';
import type { StepLog } from '@/src/api/types/procedure.types';
import { MediaViewerModal } from '@/src/components/common/MediaViewerModal';
import { useRouter } from 'expo-router';

const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

interface CompletedSectionProps {
    step: StepLog;
    theme: any;
    onEdit?: () => void;
}

export const CompletedSection: React.FC<CompletedSectionProps> = ({ step, theme, onEdit }) => {
    const styles = createStyles(theme);
    const router = useRouter();

    // Backend returns uppercase status values
    const status = step.completion_status?.toUpperCase();
    const statusLabel = status === 'COMPLIANT'
        ? 'Uygun'
        : status === 'NON_COMPLIANT'
            ? 'Uygun Değil'
            : 'Uygulanamaz';
    const statusColor = status === 'COMPLIANT'
        ? theme.success
        : status === 'NON_COMPLIANT'
            ? theme.error
            : theme.warning;

    // Media Viewer State
    const [viewerVisible, setViewerVisible] = React.useState(false);
    const [selectedUri, setSelectedUri] = React.useState<string | null>(null);
    const [selectedType, setSelectedType] = React.useState<'photo' | 'video'>('photo');

    const handleMediaPress = (uri: string) => {
        setSelectedUri(uri);
        setSelectedType(isVideoUrl(uri) ? 'video' : 'photo');
        setViewerVisible(true);
    };

    return (
        <View style={{ paddingTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons
                        name={status === 'COMPLIANT' ? 'check-circle' : status === 'NON_COMPLIANT' ? 'cancel' : 'info'}
                        size={20}
                        color={statusColor}
                    />
                    <Text weight="600" color={statusColor} style={{ fontSize: 14 }}>{statusLabel}</Text>
                </View>
            </View>

            {step.photo_urls && step.photo_urls.length > 0 && (
                <View style={{ flexDirection: 'row', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                    {step.photo_urls.map((url, idx) => {
                        const isVideo = isVideoUrl(url);
                        return (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => handleMediaPress(url)}
                                activeOpacity={0.8}
                            >
                                {isVideo ? (
                                    <View
                                        style={[
                                            styles.photoThumbnail,
                                            styles.videoPlaceholder
                                        ]}
                                    >
                                        <MaterialIcons name="play-circle-filled" size={24} color="#FFF" />
                                        <Text variant="caption" color="#FFF" style={styles.videoLabel}>
                                            VİDEO
                                        </Text>
                                    </View>
                                ) : (
                                    <Image
                                        source={{ uri: url }}
                                        style={styles.photoThumbnail}
                                        resizeMode="cover"
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {step.notes && (
                <View style={{ marginTop: 12, backgroundColor: theme.backgroundSecondary, padding: 12, borderRadius: 8 }}>
                    <Text variant="caption" color={theme.textSecondary} style={{ marginBottom: 4 }}>
                        Not:
                    </Text>
                    <Text color={theme.text}>{step.notes}</Text>
                </View>
            )}

            {step.completed_at && (
                <Text variant="caption" color={theme.textMuted} style={{ marginTop: 12 }}>
                    Tamamlandı: {new Date(step.completed_at).toLocaleString('tr-TR')}
                    {step.completed_by_name && ` • ${step.completed_by_name}`}
                </Text>
            )}

            {step.completion_status === 'NON_COMPLIANT' && step.issues && step.issues.length > 0 && (
                step.issues.map((issue) => {
                    const isResolved = ['RESOLVED', 'CLOSED', 'VERIFIED'].includes(issue.status || '');
                    return (
                        <TouchableOpacity
                            key={issue.id}
                            activeOpacity={0.7}
                            onPress={() => router.push(`/(main)/execution/issues/${issue.id}`)}
                            style={{
                                marginTop: 8,
                                padding: 8,
                                backgroundColor: isResolved ? theme.successLight + '20' : theme.error + '10',
                                borderRadius: 6,
                                borderLeftWidth: 3,
                                borderLeftColor: isResolved ? theme.success : theme.error,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text weight="500" color={theme.text} numberOfLines={1}>{issue.title}</Text>
                                {isResolved ? (
                                    <Text variant="caption" color={theme.success}>
                                        <MaterialIcons name="check-circle" size={12} color={theme.success} />
                                        {' '}
                                        {issue.status === 'RESOLVED'
                                            ? `${new Date(issue.resolved_at!).toLocaleDateString('tr-TR')} tarihinde çözüldü`
                                            : `Durum: ${issue.status}`}
                                    </Text>
                                ) : (
                                    <Text variant="caption" color={theme.error}>
                                        Uygunsuzluk kaydını görüntüle ({issue.status})
                                    </Text>
                                )}
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
                        </TouchableOpacity>
                    );
                })
            )}

            <MediaViewerModal
                visible={viewerVisible}
                onClose={() => setViewerVisible(false)}
                uri={selectedUri}
                type={selectedType}
            />
        </View>
    );
};

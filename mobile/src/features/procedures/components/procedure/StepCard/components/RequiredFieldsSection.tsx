import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Image, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Text } from '@/src/components/common/Text';
import { createStyles } from '../styles';
import { Spacing, BorderRadius } from '@/src/constants/theme';
import type { IssueSeverity, RequiredFields } from '../types';

const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

interface RequiredFieldsSectionProps {
    requiredPhoto: boolean;
    requiredNotes: boolean;
    capturedPhotos: string[];
    setCapturedPhotos: (photos: string[]) => void;
    noteText: string;
    setNoteText: (text: string) => void;
    theme: any;
    isPending: boolean;
    severity: IssueSeverity;
    setSeverity: (s: IssueSeverity) => void;
    showSeverity?: boolean;
}

const severityConfig: Record<IssueSeverity, { label: string; shortLabel: string }> = {
    low: { label: 'Düşük', shortLabel: 'DÜ' },
    medium: { label: 'Orta', shortLabel: 'OR' },
    high: { label: 'Yüksek', shortLabel: 'YÜ' },
    critical: { label: 'Kritik', shortLabel: 'KR' },
};

export const RequiredFieldsSection: React.FC<RequiredFieldsSectionProps> = ({
    requiredPhoto,
    requiredNotes,
    capturedPhotos,
    setCapturedPhotos,
    noteText,
    setNoteText,
    theme,
    isPending,
    severity,
    setSeverity,
    showSeverity = false,
}) => {
    const styles = createStyles(theme);

    const removePhoto = (index: number) => {
        const updated = [...capturedPhotos];
        updated.splice(index, 1);
        setCapturedPhotos(updated);
    };

    const getSeverityColor = (sev: IssueSeverity) => {
        switch (sev) {
            case 'low': return theme.success;
            case 'medium': return theme.warning;
            case 'high': return theme.error;
            case 'critical': return theme.error;
            default: return theme.primary;
        }
    };

    if (!requiredPhoto && !requiredNotes && !showSeverity) {
        return null;
    }

    return (
        <View style={{ marginTop: Spacing.md }}>
            {/* Severity Selection (for non-compliant) */}
            {showSeverity && (
                <View style={{ marginBottom: Spacing.md }}>
                    <Text variant="caption" color={theme.textSecondary} weight="600" style={{ marginBottom: 6 }}>
                        Önem Derecesi
                    </Text>
                    <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                        {(['low', 'medium', 'high', 'critical'] as IssueSeverity[]).map((sev) => (
                            <TouchableOpacity
                                key={sev}
                                onPress={() => setSeverity(sev)}
                                disabled={isPending}
                                style={{
                                    flex: 1,
                                    paddingVertical: Spacing.xs,
                                    borderRadius: BorderRadius.sm,
                                    backgroundColor: severity === sev ? getSeverityColor(sev) : theme.backgroundSecondary,
                                    borderWidth: 1,
                                    borderColor: severity === sev ? getSeverityColor(sev) : theme.border,
                                    alignItems: 'center',
                                    opacity: isPending ? 0.5 : 1,
                                }}
                            >
                                <Text
                                    variant="caption"
                                    color={severity === sev ? '#FFF' : theme.textSecondary}
                                    weight="600"
                                    style={{ fontSize: 10 }}
                                >
                                    {severityConfig[sev].shortLabel}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Notes Input */}
            {requiredNotes && (
                <View style={{ marginBottom: requiredPhoto ? Spacing.sm : 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <MaterialIcons name="edit" size={14} color={theme.primary} />
                        <Text variant="caption" color={theme.textSecondary} style={{ marginLeft: 4 }}>
                            Not {requiredNotes && <Text color={theme.error}>*</Text>}
                        </Text>
                        {noteText.trim().length > 0 && (
                            <MaterialIcons name="check-circle" size={12} color={theme.success} style={{ marginLeft: 6 }} />
                        )}
                    </View>
                    <TextInput
                        style={[
                            styles.inputField,
                            {
                                borderColor: noteText.trim().length > 0 ? theme.primary : theme.border,
                                color: theme.text,
                                backgroundColor: theme.background,
                            }
                        ]}
                        placeholder="Not ekle..."
                        placeholderTextColor={theme.textMuted}
                        multiline
                        value={noteText}
                        onChangeText={setNoteText}
                        editable={!isPending}
                    />
                </View>
            )}

            {/* Photo Preview Section (Only shows if photos exist) */}
            {(requiredPhoto || capturedPhotos.length > 0) && (
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <MaterialIcons name="photo-camera" size={14} color={theme.primary} />
                        <Text variant="caption" color={theme.textSecondary} style={{ marginLeft: 4 }}>
                            Fotoğraf {requiredPhoto && <Text color={theme.error}>*</Text>}
                        </Text>
                        {capturedPhotos.length > 0 && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
                                <MaterialIcons name="check-circle" size={12} color={theme.success} />
                                <Text variant="caption" color={theme.success} weight="600" style={{ marginLeft: 2 }}>
                                    {capturedPhotos.length}
                                </Text>
                            </View>
                        )}
                    </View>

                    {capturedPhotos.length > 0 ? (
                        <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                            <FlatList
                                data={capturedPhotos}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(_, idx) => idx.toString()}
                                renderItem={({ item, index }) => {
                                    const isVideo = isVideoUrl(item);
                                    return (
                                        <View style={{ marginRight: 8, position: 'relative' }}>
                                            {isVideo ? (
                                                <View style={{
                                                    width: 70,
                                                    height: 70,
                                                    borderRadius: BorderRadius.sm,
                                                    borderWidth: 1,
                                                    borderColor: theme.border,
                                                    backgroundColor: '#000',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}>
                                                    <MaterialIcons name="play-circle-filled" size={32} color="#FFF" />
                                                    <Text variant="caption" color="#FFF" style={{ position: 'absolute', bottom: 4, fontSize: 10 }}>
                                                        VİDEO
                                                    </Text>
                                                </View>
                                            ) : (
                                                <Image
                                                    source={{ uri: item }}
                                                    style={{
                                                        width: 70,
                                                        height: 70,
                                                        borderRadius: BorderRadius.sm,
                                                        borderWidth: 1,
                                                        borderColor: theme.border,
                                                    }}
                                                    resizeMode="cover"
                                                />
                                            )}
                                            <TouchableOpacity
                                                onPress={() => removePhoto(index)}
                                                style={{
                                                    position: 'absolute',
                                                    top: -6,
                                                    right: -6,
                                                    backgroundColor: theme.error,
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 10,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <MaterialIcons name="close" size={12} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                }}
                            />
                        </View>
                    ) : (
                        // Optional: Show empty state text if required but no photos? 
                        // Or just nothing since the button serves as the call to action
                        requiredPhoto && (
                            <Text variant="caption" color={theme.textMuted} style={{ fontStyle: 'italic', marginBottom: 8 }}>
                                Lütfen yukarıdaki kamera butonunu kullanarak fotoğraf ekleyin.
                            </Text>
                        )
                    )}
                </View>
            )}
        </View>
    );
};

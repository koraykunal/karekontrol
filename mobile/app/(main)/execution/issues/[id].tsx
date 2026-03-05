import { View, ScrollView, ActivityIndicator, TouchableOpacity, FlatList, Image, Alert, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Card } from '@/src/components/common/Card';
import { Text } from '@/src/components/common/Text';
import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { issueService } from '@/src/api/services/issue.service';
import { IssueStatus, IssueSeverity } from '@/src/api/types/enums';
import { MediaViewerModal } from '@/src/components/common/MediaViewerModal';

const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

export default function IssueDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const queryClient = useQueryClient();

    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editPhotos, setEditPhotos] = useState<string[]>([]);
    const [editNotes, setEditNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const [viewerVisible, setViewerVisible] = useState(false);
    const [selectedUri, setSelectedUri] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'photo' | 'video'>('photo');

    const handleMediaPress = (uri: string) => {
        setSelectedUri(uri);
        setSelectedType(isVideoUrl(uri) ? 'video' : 'photo');
        setViewerVisible(true);
    };

    const issueId = Number(id);

    const { data: issue, isLoading, error } = useQuery({
        queryKey: ['issue', issueId],
        queryFn: () => issueService.getIssue(issueId),
        enabled: !!issueId,
    });

    const resolveMutation = useMutation({
        mutationFn: (data: { notes?: string; photos?: string[] }) =>
            issueService.resolveIssue(issueId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
            Alert.alert('Başarılı', 'Uygunsuzluk başarıyla çözüldü.');
            router.canGoBack() ? router.back() : router.replace('/(main)/(tabs)/(dashboard)');
        },
        onError: (err) => {
            console.error(err);
            Alert.alert('Hata', 'Uygunsuzluk çözülürken bir hata oluştu.');
        },
    });

    const handleCameraPress = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Fotoğraf eklemek için kamera izni gereklidir.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.6,
                allowsEditing: false,
            });

            if (!result.canceled && result.assets?.[0]) {
                setPhotos((prev) => [...prev, result.assets[0].uri]);
            }
        } catch (error) {
            Alert.alert('Hata', 'Kamera açılırken bir sorun oluştu.');
        }
    };

    const handleGalleryPress = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Galeriye erişim izni gereklidir.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.6,
                allowsMultipleSelection: true,
                selectionLimit: 5,
            });

            if (!result.canceled && result.assets) {
                setPhotos((prev) => [...prev, ...result.assets.map(a => a.uri)]);
            }
        } catch (error) {
            Alert.alert('Hata', 'Galeri açılırken bir sorun oluştu.');
        }
    };

    const handleEditCameraPress = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') return;
            const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
            if (!result.canceled && result.assets?.[0]) {
                setEditPhotos((prev) => [...prev, result.assets[0].uri]);
            }
        } catch (error) {
            Alert.alert('Hata', 'Kamera açılırken bir sorun oluştu.');
        }
    };

    const handleEditGalleryPress = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return;
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsMultipleSelection: true, selectionLimit: 5 });
            if (!result.canceled && result.assets) {
                setEditPhotos((prev) => [...prev, ...result.assets.map(a => a.uri)]);
            }
        } catch (error) {
            Alert.alert('Hata', 'Galeri açılırken bir sorun oluştu.');
        }
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const removeEditPhoto = (index: number) => {
        setEditPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const handleResolve = () => {
        if (notes.trim().length === 0 && photos.length === 0) {
            Alert.alert('Uyarı', 'Lütfen en az bir not veya fotoğraf ekleyin.');
            return;
        }
        resolveMutation.mutate({ notes: notes.trim() || undefined, photos });
    };

    const handleStartEdit = () => {
        if (!issue) return;
        setEditPhotos(issue.resolution_photo_urls || []);
        setEditNotes(issue.resolved_notes || '');
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        try {
            setSaving(true);
            await issueService.updateIssue(issueId, {
                resolution_photo_urls: editPhotos,
                resolved_notes: editNotes.trim() || undefined,
            } as any);
            queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
            setIsEditing(false);
            Alert.alert('Başarılı', 'Çözüm bilgileri güncellendi.');
        } catch (err) {
            Alert.alert('Hata', 'Güncelleme sırasında bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (error || !issue) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <MaterialIcons name="error-outline" size={48} color={theme.textSecondary} />
                <Text style={{ marginTop: 10, textAlign: 'center' }} color={theme.textSecondary}>
                    Uygunsuzluk detayı yüklenemedi.
                </Text>
            </View>
        );
    }

    const isResolved = [IssueStatus.RESOLVED, IssueStatus.CLOSED, IssueStatus.VERIFIED].includes(issue.status as IssueStatus);

    const getSeverityColor = (severity: IssueSeverity) => {
        switch (severity) {
            case IssueSeverity.CRITICAL: return theme.error;
            case IssueSeverity.HIGH: return theme.warning;
            case IssueSeverity.MEDIUM: return theme.warning;
            case IssueSeverity.LOW: return theme.info;
            default: return theme.textSecondary;
        }
    };

    const getStatusColor = (status: IssueStatus) => {
        switch (status) {
            case IssueStatus.RESOLVED: return theme.success;
            case IssueStatus.CLOSED: return theme.textSecondary;
            case IssueStatus.IN_PROGRESS: return theme.info;
            default: return theme.error; // Open
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary }}>
            <Stack.Screen options={{ title: 'Uygunsuzluk Detayı', headerBackTitle: 'Geri' }} />

            <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}>

                {/* Header Info Card */}
                <Card style={{ padding: Spacing.md, marginBottom: Spacing.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            <View style={{
                                paddingHorizontal: 8, paddingVertical: 2,
                                backgroundColor: getSeverityColor(issue.severity) + '20',
                                borderRadius: BorderRadius.sm,
                                borderWidth: 1, borderColor: getSeverityColor(issue.severity)
                            }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: getSeverityColor(issue.severity) }}>
                                    {issue.severity.toUpperCase()}
                                </Text>
                            </View>
                            <View style={{
                                paddingHorizontal: 8, paddingVertical: 2,
                                backgroundColor: getStatusColor(issue.status) + '20',
                                borderRadius: BorderRadius.sm,
                                borderWidth: 1, borderColor: getStatusColor(issue.status)
                            }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: getStatusColor(issue.status) }}>
                                    {issue.status.toUpperCase().replace('_', ' ')}
                                </Text>
                            </View>
                        </View>
                        <Text variant="caption" color={theme.textSecondary}>
                            #{issue.id}
                        </Text>
                    </View>

                    <Text variant="h3" style={{ marginBottom: Spacing.xs }}>{issue.title}</Text>
                    <Text color={theme.textSecondary} style={{ marginBottom: Spacing.md }}>{issue.description}</Text>

                    <View style={{ height: 1, backgroundColor: theme.border, marginVertical: Spacing.sm }} />

                    <View style={{ gap: Spacing.sm }}>
                        <InfoRow
                            icon="business"
                            label="Varlık"
                            value={issue.entity_name || '-'}
                            theme={theme}
                        />
                        <InfoRow
                            icon="description"
                            label="Prosedür Adımı"
                            value={issue.step_title || '-'}
                            theme={theme}
                        />
                        {/* Note: issue.procedure_step isn't in type effectively, maybe description contains context? */}

                        <InfoRow
                            icon="person"
                            label="Raporlayan"
                            value={issue.reported_by_name || '-'}
                            theme={theme}
                        />
                        <InfoRow
                            icon="calendar-today"
                            label="Tarih"
                            value={format(new Date(issue.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                            theme={theme}
                        />
                    </View>

                    {issue.photo_urls && issue.photo_urls.length > 0 && (
                        <View style={{ marginTop: Spacing.md }}>
                            <Text variant="bodySmall" weight="600" style={{ marginBottom: Spacing.sm }}>Fotoğraflar</Text>
                            <FlatList
                                data={issue.photo_urls}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => {
                                    const isVideo = isVideoUrl(item);
                                    return (
                                        <TouchableOpacity onPress={() => handleMediaPress(item)} activeOpacity={0.8}>
                                            {isVideo ? (
                                                <View style={{ width: 80, height: 80, borderRadius: BorderRadius.md, marginRight: Spacing.sm, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                                                    <MaterialIcons name="play-circle-filled" size={24} color="#FFF" />
                                                    <Text style={{ position: 'absolute', bottom: 2, fontSize: 8, color: '#FFF', fontWeight: '700' }}>VİDEO</Text>
                                                </View>
                                            ) : (
                                                <Image
                                                    source={{ uri: item }}
                                                    style={{ width: 80, height: 80, borderRadius: BorderRadius.md, marginRight: Spacing.sm, backgroundColor: theme.backgroundSecondary }}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    )}
                </Card>

                {isResolved ? (
                    <Card style={{ padding: Spacing.md, borderLeftWidth: 4, borderLeftColor: theme.success }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialIcons name="check-circle" size={24} color={theme.success} style={{ marginRight: 8 }} />
                                <Text variant="h3" color={theme.success}>Çözüldü</Text>
                            </View>
                            {!isEditing && (
                                <TouchableOpacity onPress={handleStartEdit} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.primaryLight, borderRadius: BorderRadius.md }}>
                                    <MaterialIcons name="edit" size={16} color={theme.primary} />
                                    <Text style={{ marginLeft: 4, color: theme.primary, fontWeight: '600', fontSize: 13 }}>Düzenle</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <InfoRow
                            icon="person-outline"
                            label="Çözümleyen"
                            value={issue.resolved_by_name || '-'}
                            subValue={issue.resolved_at ? format(new Date(issue.resolved_at), 'dd MMM yyyy HH:mm', { locale: tr }) : undefined}
                            theme={theme}
                        />

                        {isEditing ? (
                            <View style={{ marginTop: Spacing.md }}>
                                <TextInput
                                    style={{
                                        backgroundColor: theme.inputBackground,
                                        borderRadius: BorderRadius.md,
                                        padding: Spacing.md,
                                        color: theme.text,
                                        minHeight: 80,
                                        textAlignVertical: 'top',
                                        borderWidth: 1,
                                        borderColor: theme.border,
                                        marginBottom: Spacing.md
                                    }}
                                    placeholder="Çözüm notu..."
                                    placeholderTextColor={theme.textMuted}
                                    multiline
                                    value={editNotes}
                                    onChangeText={setEditNotes}
                                />

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: 8 }}>
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.primaryLight, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: theme.primary }}
                                        onPress={handleEditCameraPress}
                                    >
                                        <MaterialIcons name="add-a-photo" size={18} color={theme.primary} />
                                        <Text style={{ marginLeft: 4, color: theme.primary, fontWeight: '600', fontSize: 12 }}>Kamera</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.primaryLight, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: theme.primary }}
                                        onPress={handleEditGalleryPress}
                                    >
                                        <MaterialIcons name="photo-library" size={18} color={theme.primary} />
                                        <Text style={{ marginLeft: 4, color: theme.primary, fontWeight: '600', fontSize: 12 }}>Galeri</Text>
                                    </TouchableOpacity>
                                </View>

                                {editPhotos.length > 0 && (
                                    <ScrollView horizontal style={{ marginBottom: Spacing.md }} showsHorizontalScrollIndicator={false}>
                                        {editPhotos.map((uri, index) => (
                                            <View key={index} style={{ marginRight: 10, position: 'relative' }}>
                                                <TouchableOpacity onPress={() => handleMediaPress(uri)} activeOpacity={0.8}>
                                                    <Image source={{ uri }} style={{ width: 70, height: 70, borderRadius: BorderRadius.sm }} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => removeEditPhoto(index)}
                                                    style={{ position: 'absolute', top: -6, right: -6, backgroundColor: theme.error, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', zIndex: 1 }}
                                                >
                                                    <MaterialIcons name="close" size={14} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}

                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                                        style={{ flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}
                                        onPress={() => setIsEditing(false)}
                                    >
                                        <Text style={{ fontWeight: '600', color: theme.textSecondary }}>İptal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center', backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }}
                                        onPress={handleSaveEdit}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <ActivityIndicator color="#FFF" size="small" />
                                        ) : (
                                            <Text style={{ fontWeight: '600', color: '#FFF' }}>Kaydet</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <>
                                {issue.resolved_notes && (
                                    <View style={{ marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: theme.backgroundSecondary, borderRadius: BorderRadius.md }}>
                                        <Text color={theme.text}>"{issue.resolved_notes}"</Text>
                                    </View>
                                )}

                                {issue.resolution_photo_urls && issue.resolution_photo_urls.length > 0 && (
                                    <View style={{ marginTop: Spacing.md }}>
                                        <Text variant="bodySmall" weight="600" style={{ marginBottom: Spacing.sm }}>Çözüm Fotoğrafları</Text>
                                        <FlatList
                                            data={issue.resolution_photo_urls}
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            keyExtractor={(item, index) => index.toString()}
                                            renderItem={({ item }) => {
                                                const isVideo = isVideoUrl(item);
                                                return (
                                                    <TouchableOpacity onPress={() => handleMediaPress(item)} activeOpacity={0.8}>
                                                        {isVideo ? (
                                                            <View style={{ width: 80, height: 80, borderRadius: BorderRadius.md, marginRight: Spacing.sm, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                                                                <MaterialIcons name="play-circle-filled" size={24} color="#FFF" />
                                                                <Text style={{ position: 'absolute', bottom: 2, fontSize: 8, color: '#FFF', fontWeight: '700' }}>VİDEO</Text>
                                                            </View>
                                                        ) : (
                                                            <Image
                                                                source={{ uri: item }}
                                                                style={{ width: 80, height: 80, borderRadius: BorderRadius.md, marginRight: Spacing.sm, backgroundColor: theme.backgroundSecondary }}
                                                            />
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            }}
                                        />
                                    </View>
                                )}
                            </>
                        )}
                    </Card>
                ) : (
                    <Card style={{ padding: Spacing.md }}>
                        <Text variant="h3" style={{ marginBottom: Spacing.sm }}>Çözümle</Text>
                        <Text color={theme.textSecondary} style={{ marginBottom: Spacing.md, fontSize: 13 }}>
                            Bu uygunsuzluğu gidermek için açıklama girebilir ve fotoğraf ekleyebilirsiniz.
                        </Text>

                        <TextInput
                            style={{
                                backgroundColor: theme.inputBackground,
                                borderRadius: BorderRadius.md,
                                padding: Spacing.md,
                                color: theme.text,
                                minHeight: 100,
                                textAlignVertical: 'top',
                                borderWidth: 1,
                                borderColor: theme.border,
                                marginBottom: Spacing.md
                            }}
                            placeholder="Çözüm notu ekleyin..."
                            placeholderTextColor={theme.textMuted}
                            multiline
                            value={notes}
                            onChangeText={setNotes}
                        />

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: 8 }}>
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row', alignItems: 'center',
                                    paddingHorizontal: 12, paddingVertical: 8,
                                    backgroundColor: theme.primaryLight,
                                    borderRadius: BorderRadius.md,
                                    borderWidth: 1, borderColor: theme.primary,
                                }}
                                onPress={handleCameraPress}
                            >
                                <MaterialIcons name="add-a-photo" size={20} color={theme.primary} />
                                <Text style={{ marginLeft: 6, color: theme.primary, fontWeight: '600' }}>Kamera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row', alignItems: 'center',
                                    paddingHorizontal: 12, paddingVertical: 8,
                                    backgroundColor: theme.primaryLight,
                                    borderRadius: BorderRadius.md,
                                    borderWidth: 1, borderColor: theme.primary,
                                }}
                                onPress={handleGalleryPress}
                            >
                                <MaterialIcons name="photo-library" size={20} color={theme.primary} />
                                <Text style={{ marginLeft: 6, color: theme.primary, fontWeight: '600' }}>Galeri</Text>
                            </TouchableOpacity>

                            {photos.length > 0 && (
                                <Text color={theme.success} style={{ fontSize: 12 }}>{photos.length} fotoğraf</Text>
                            )}
                        </View>

                        {photos.length > 0 && (
                            <ScrollView horizontal style={{ marginBottom: Spacing.md }} showsHorizontalScrollIndicator={false}>
                                {photos.map((uri, index) => {
                                    const isVideo = isVideoUrl(uri);
                                    return (
                                        <View key={index} style={{ marginRight: 10, position: 'relative' }}>
                                            <TouchableOpacity onPress={() => handleMediaPress(uri)} activeOpacity={0.8}>
                                                {isVideo ? (
                                                    <View style={{ width: 70, height: 70, borderRadius: BorderRadius.sm, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                                                        <MaterialIcons name="play-circle-filled" size={24} color="#FFF" />
                                                    </View>
                                                ) : (
                                                    <Image source={{ uri }} style={{ width: 70, height: 70, borderRadius: BorderRadius.sm }} />
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => removePhoto(index)}
                                                style={{
                                                    position: 'absolute', top: -6, right: -6,
                                                    backgroundColor: theme.error, borderRadius: 10,
                                                    width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
                                                    zIndex: 1
                                                }}
                                            >
                                                <MaterialIcons name="close" size={14} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}

                        <TouchableOpacity
                            style={{
                                backgroundColor: theme.primary,
                                padding: Spacing.md,
                                borderRadius: BorderRadius.md,
                                alignItems: 'center',
                                marginTop: Spacing.sm,
                                opacity: resolveMutation.isPending ? 0.7 : 1
                            }}
                            onPress={handleResolve}
                            disabled={resolveMutation.isPending}
                        >
                            {resolveMutation.isPending ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Çözümle ve Kapat</Text>
                            )}
                        </TouchableOpacity>
                    </Card>
                )}

            </ScrollView>

            <MediaViewerModal
                visible={viewerVisible}
                onClose={() => setViewerVisible(false)}
                uri={selectedUri}
                type={selectedType}
            />
        </View>
    );
}

const InfoRow = ({ icon, label, value, subValue, theme }: any) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialIcons name={icon as any} size={18} color={theme.textMuted} style={{ marginRight: 8, width: 24 }} />
        <View>
            <Text variant="caption" color={theme.textSecondary}>{label}</Text>
            <Text variant="bodySmall" weight="500">{value}</Text>
            {subValue && <Text variant="caption" color={theme.textMuted}>{subValue}</Text>}
        </View>
    </View>
);

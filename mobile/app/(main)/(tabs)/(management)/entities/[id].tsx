import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { Screen } from '@/src/components/common/Screen';
import { Text } from '@/src/components/common/Text';
import { Button } from '@/src/components/common/Button';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { usePermissions, useUpdateEntity, useDeleteEntity, useUploadEntityImage } from '@/src/features/management';
import { useEntity } from '@/src/features/entities/hooks/queries';

export default function EntityEditScreen() {
    const { id } = useLocalSearchParams();
    const entityId = Number(id);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { canManage, canManageDepartment } = usePermissions();

    const { data: entityData, isLoading } = useEntity(entityId);
    const entity = (entityData as any)?.data || entityData;

    const updateEntity = useUpdateEntity();
    const deleteEntity = useDeleteEntity();
    const uploadImage = useUploadEntityImage();

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [entityType, setEntityType] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Initialize form when entity loads
    useEffect(() => {
        if (entity) {
            setName(entity.name || '');
            setDescription(entity.description || '');
            setLocation(entity.location || '');
            setEntityType(entity.entity_type || '');
        }
    }, [entity]);

    if (!canManage) {
        return <Redirect href="/(main)/(tabs)/(dashboard)" />;
    }

    if (isLoading) {
        return (
            <Screen center style={{ backgroundColor: theme.backgroundSecondary }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </Screen>
        );
    }

    if (!entity) {
        return (
            <Screen center style={{ backgroundColor: theme.backgroundSecondary }}>
                <Text>Varlık bulunamadı</Text>
            </Screen>
        );
    }

    const canEdit = canManageDepartment(entity.department);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Hata', 'Varlık adı gereklidir.');
            return;
        }

        try {
            await updateEntity.mutateAsync({
                id: entityId,
                data: {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    location: location.trim() || undefined,
                    entity_type: entityType.trim() || undefined,
                }
            });
            Alert.alert('Başarılı', 'Varlık güncellendi.', [
                { text: 'Tamam', onPress: () => router.canGoBack() ? router.back() : router.replace('/(main)/(tabs)/(management)/entities') }
            ]);
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Güncelleme başarısız.');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Varlığı Sil',
            'Bu varlığı silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteEntity.mutateAsync(entityId);
                            router.canGoBack() ? router.back() : router.replace('/(main)/(tabs)/(management)/entities');
                        } catch (error: any) {
                            Alert.alert('Hata', error.message || 'Silme başarısız.');
                        }
                    }
                }
            ]
        );
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleUploadImage = async () => {
        if (!selectedImage) return;

        try {
            await uploadImage.mutateAsync({
                entityId,
                imageUri: selectedImage,
                isPrimary: true,
            });
            Alert.alert('Başarılı', 'Görsel yüklendi.');
            setSelectedImage(null);
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Görsel yüklenemedi.');
        }
    };

    const currentImage = selectedImage || entity.primary_image_url || entity.primary_image?.thumbnail;

    return (
        <Screen padding={false} safeArea={false} style={{ backgroundColor: theme.backgroundSecondary }}>
            <Stack.Screen options={{ title: entity.name }} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Info Card */}
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text variant="caption" color={theme.textSecondary}>Kod</Text>
                        <Text variant="body" weight="600">{entity.code}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text variant="caption" color={theme.textSecondary}>Departman</Text>
                        <Text variant="body">{entity.department_name}</Text>
                    </View>
                </Card>

                {/* Image Upload Section */}
                {canEdit && (
                    <Card style={styles.formCard}>
                        <Text variant="h3" style={styles.formTitle}>Varlık Görseli</Text>

                        <TouchableOpacity
                            style={[styles.imagePickerContainer, { borderColor: theme.border }]}
                            onPress={pickImage}
                        >
                            {currentImage ? (
                                <Image
                                    source={{ uri: currentImage }}
                                    style={styles.previewImage}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Ionicons name="image-outline" size={48} color={theme.textMuted} />
                                    <Text variant="caption" color={theme.textMuted} style={{ marginTop: 8 }}>
                                        Görsel eklemek için dokunun
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {selectedImage && (
                            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
                                <Button
                                    title="Yükle"
                                    variant="primary"
                                    onPress={handleUploadImage}
                                    loading={uploadImage.isPending}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="İptal"
                                    variant="secondary"
                                    onPress={() => setSelectedImage(null)}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        )}
                    </Card>
                )}

                {/* Edit Form */}
                <Card style={styles.formCard}>
                    <Text variant="h3" style={styles.formTitle}>Düzenle</Text>

                    <View style={styles.inputGroup}>
                        <Text variant="bodySmall" weight="500" style={styles.label}>Varlık Adı *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Varlık adını girin"
                            placeholderTextColor={theme.textMuted}
                            editable={canEdit}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text variant="bodySmall" weight="500" style={styles.label}>Açıklama</Text>
                        <TextInput
                            style={[styles.input, styles.multilineInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Açıklama girin"
                            placeholderTextColor={theme.textMuted}
                            multiline
                            numberOfLines={3}
                            editable={canEdit}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text variant="bodySmall" weight="500" style={styles.label}>Konum</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Konum bilgisi"
                            placeholderTextColor={theme.textMuted}
                            editable={canEdit}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text variant="bodySmall" weight="500" style={styles.label}>Varlık Tipi</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                            value={entityType}
                            onChangeText={setEntityType}
                            placeholder="Örn: Ekipman, Araç"
                            placeholderTextColor={theme.textMuted}
                            editable={canEdit}
                        />
                    </View>
                </Card>

                {/* Action Buttons */}
                {canEdit && (
                    <View style={styles.actions}>
                        <Button
                            title="Kaydet"
                            variant="primary"
                            fullWidth
                            onPress={handleSave}
                            loading={updateEntity.isPending}
                        />
                        <Button
                            title="Varlığı Sil"
                            variant="danger"
                            fullWidth
                            onPress={handleDelete}
                            loading={deleteEntity.isPending}
                        />
                    </View>
                )}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.md,
        paddingBottom: 40,
    },
    infoCard: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    formCard: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    formTitle: {
        marginBottom: Spacing.md,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    label: {
        marginBottom: Spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: 16,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    actions: {
        gap: Spacing.sm,
    },
    imagePickerContainer: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        minHeight: 180,
    },
    previewImage: {
        width: '100%',
        height: 180,
    },
    imagePlaceholder: {
        flex: 1,
        minHeight: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

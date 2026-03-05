import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Text } from '@/src/components/common/Text';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { issueService } from '@/src/api/services/issue.service';
import { IssueSeverity } from '@/src/api/types/enums';

const SEVERITY_OPTIONS = [
    { label: 'Düşük', value: IssueSeverity.LOW, color: '#65a30d' },
    { label: 'Orta', value: IssueSeverity.MEDIUM, color: '#d97706' },
    { label: 'Yüksek', value: IssueSeverity.HIGH, color: '#ea580c' },
    { label: 'Kritik', value: IssueSeverity.CRITICAL, color: '#dc2626' },
];

export default function CreateIssueScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ entityId?: string; entityName?: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const queryClient = useQueryClient();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState(IssueSeverity.MEDIUM);
    const [photos, setPhotos] = useState<string[]>([]);

    const createMutation = useMutation({
        mutationFn: (data: any) => issueService.createIssue(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issues'] });
            Alert.alert('Başarılı', 'Uygunsuzluk bildirildi.', [
                { text: 'Tamam', onPress: () => router.canGoBack() ? router.back() : router.replace('/(main)/(tabs)/(dashboard)') },
            ]);
        },
        onError: () => {
            Alert.alert('Hata', 'Uygunsuzluk bildirilemedi. Lütfen tekrar deneyin.');
        },
    });

    const handlePickPhoto = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsMultipleSelection: true,
        });
        if (!result.canceled) {
            setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)]);
        }
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            Alert.alert('Hata', 'Başlık zorunludur.');
            return;
        }
        createMutation.mutate({
            title: title.trim(),
            description: description.trim(),
            severity,
            entity: params.entityId ? Number(params.entityId) : undefined,
            photo_urls: photos.length > 0 ? photos : undefined,
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Sorun Bildir',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: theme.backgroundSecondary },
                headerTintColor: theme.text,
                headerTitleStyle: { fontWeight: '600' },
            }} />

            <ScrollView contentContainerStyle={styles.content}>
                {params.entityName && (
                    <View style={[styles.entityBanner, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="cube-outline" size={16} color={theme.primary} />
                        <Text variant="caption" weight="600" color={theme.primary}>
                            {params.entityName}
                        </Text>
                    </View>
                )}

                <Text weight="600" style={styles.label}>Başlık *</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Uygunsuzluk başlığı"
                    placeholderTextColor={theme.textMuted}
                />

                <Text weight="600" style={styles.label}>Açıklama</Text>
                <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Detaylı açıklama"
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />

                <Text weight="600" style={styles.label}>Ciddiyet</Text>
                <View style={styles.severityRow}>
                    {SEVERITY_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.severityChip,
                                severity === opt.value
                                    ? { backgroundColor: opt.color }
                                    : { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border },
                            ]}
                            onPress={() => setSeverity(opt.value)}
                        >
                            <Text
                                variant="caption"
                                weight="600"
                                color={severity === opt.value ? '#fff' : theme.textSecondary}
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text weight="600" style={styles.label}>Fotoğraflar</Text>
                <View style={styles.photoRow}>
                    {photos.map((uri, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.photoThumb}
                            onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        >
                            <Ionicons name="close-circle" size={20} color="#ef4444" style={styles.photoRemove} />
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={[styles.addPhotoBtn, { borderColor: theme.border }]}
                        onPress={handlePickPhoto}
                    >
                        <Ionicons name="camera-outline" size={24} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                    onPress={handleSubmit}
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text weight="700" color="#fff">Bildir</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.md, paddingBottom: Spacing.xxxl },
    entityBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    label: { marginBottom: Spacing.xs, marginTop: Spacing.md },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        fontSize: 15,
    },
    textArea: { height: 100 },
    severityRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    severityChip: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    photoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    photoThumb: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.sm,
        backgroundColor: '#e5e7eb',
    },
    photoRemove: { position: 'absolute', top: -6, right: -6 },
    addPhotoBtn: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtn: {
        marginTop: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
});

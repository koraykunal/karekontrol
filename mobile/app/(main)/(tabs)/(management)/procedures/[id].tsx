import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams, ShadowDecorator, OpacityDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Screen } from '@/src/components/common/Screen';
import { Text } from '@/src/components/common/Text';
import { Button } from '@/src/components/common/Button';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import {
    usePermissions,
    useUpdateProcedure,
    useDeleteProcedure,
    useActivateProcedure,
    useDeactivateProcedure,
    useProcedureSteps,
    useCreateStep,
    useDeleteStep,
    useUpdateStep,
    useReorderSteps,
} from '@/src/features/management';
import { useProcedure } from '@/src/features/procedures/hooks/queries';
import { ProcedureStep } from '@/src/api/types/procedure.types';
import { ProcedurePriority } from '@/src/api/types/enums';

const priorityOptions = [
    { value: ProcedurePriority.LOW, label: 'Düşük', color: '#10B981' },
    { value: ProcedurePriority.MEDIUM, label: 'Orta', color: '#F59E0B' },
    { value: ProcedurePriority.HIGH, label: 'Yüksek', color: '#EF4444' },
    { value: ProcedurePriority.CRITICAL, label: 'Kritik', color: '#DC2626' },
];

export default function ProcedureEditScreen() {
    const { id } = useLocalSearchParams();
    const procedureId = Number(id);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { canManage } = usePermissions();

    const { data: procedureData, isLoading: isLoadingProcedure } = useProcedure(procedureId);
    const procedure = (procedureData as any)?.data || procedureData;

    const { data: stepsData, isLoading: isLoadingSteps } = useProcedureSteps(procedureId);
    const fetchedSteps: ProcedureStep[] = (stepsData as any)?.data || stepsData || [];

    const updateProcedure = useUpdateProcedure();
    const deleteProcedure = useDeleteProcedure();
    const activateProcedure = useActivateProcedure();
    const deactivateProcedure = useDeactivateProcedure();
    const createStep = useCreateStep();
    const deleteStep = useDeleteStep();
    const updateStep = useUpdateStep();
    const reorderSteps = useReorderSteps();

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<ProcedurePriority>(ProcedurePriority.MEDIUM);
    const [intervalValue, setIntervalValue] = useState('30');
    const [intervalUnit, setIntervalUnit] = useState<'DAYS' | 'WEEKS' | 'MONTHS'>('DAYS');
    const [requiresApproval, setRequiresApproval] = useState(false);
    const [newStepTitle, setNewStepTitle] = useState('');
    const [editingStepId, setEditingStepId] = useState<number | null>(null);
    const [editingStepTitle, setEditingStepTitle] = useState('');

    // Local steps state for optimistic updates and reordering
    const [steps, setSteps] = useState<ProcedureStep[]>([]);
    const [hasOrderChanged, setHasOrderChanged] = useState(false);

    useEffect(() => {
        if (procedure) {
            setTitle(procedure.title || '');
            setDescription(procedure.description || '');
            setPriority(procedure.priority || ProcedurePriority.MEDIUM);
            setIntervalValue(String(procedure.interval_value || 30));
            setIntervalUnit(procedure.interval_unit || 'DAYS');
            setRequiresApproval(procedure.requires_approval || false);
        }
    }, [procedure]);

    useEffect(() => {
        if (fetchedSteps.length > 0) {
            // Sort steps by step_order
            const sortedSteps = [...fetchedSteps].sort((a, b) => a.step_order - b.step_order);
            setSteps(sortedSteps);
        }
    }, [fetchedSteps]);

    if (!canManage) {
        return <Redirect href="/(main)/(tabs)/(dashboard)" />;
    }

    if (isLoadingProcedure || isLoadingSteps) {
        return (
            <Screen center style={{ backgroundColor: theme.backgroundSecondary }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </Screen>
        );
    }

    if (!procedure) {
        return (
            <Screen center style={{ backgroundColor: theme.backgroundSecondary }}>
                <Text>Prosedür bulunamadı</Text>
            </Screen>
        );
    }

    const isActive = procedure.is_active !== false;

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Hata', 'Prosedür başlığı gereklidir.');
            return;
        }

        try {
            await updateProcedure.mutateAsync({
                id: procedureId,
                data: {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    priority: priority.toUpperCase() as any,
                    interval_value: parseInt(intervalValue) || 30,
                    interval_unit: intervalUnit.toUpperCase() as any,
                    requires_approval: requiresApproval,
                }
            });

            // Update step orders if changed
            if (hasOrderChanged) {
                const stepOrders = steps.map((step, index) => ({
                    id: step.id,
                    order: index + 1
                }));

                await reorderSteps.mutateAsync({
                    procedureId,
                    stepOrders
                });

                setHasOrderChanged(false);
            }

            Alert.alert('Başarılı', 'Prosedür güncellendi.');
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Güncelleme başarısız.');
        }
    };

    const handleToggleActive = async () => {
        try {
            if (isActive) {
                await deactivateProcedure.mutateAsync(procedureId);
                Alert.alert('Başarılı', 'Prosedür devre dışı bırakıldı.');
            } else {
                await activateProcedure.mutateAsync(procedureId);
                Alert.alert('Başarılı', 'Prosedür aktif edildi.');
            }
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'İşlem başarısız.');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Prosedürü Sil',
            'Bu prosedürü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProcedure.mutateAsync(procedureId);
                            router.canGoBack() ? router.back() : router.replace('/(main)/(tabs)/(management)/procedures');
                        } catch (error: any) {
                            Alert.alert('Hata', error.message || 'Silme başarısız.');
                        }
                    }
                }
            ]
        );
    };

    const handleAddStep = async () => {
        if (!newStepTitle.trim()) return;

        try {
            await createStep.mutateAsync({
                procedureId,
                data: {
                    title: newStepTitle.trim(),
                    step_order: steps.length + 1,
                }
            });
            setNewStepTitle('');
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Adım eklenemedi.');
        }
    };

    const handleUpdateStep = async (stepId: number) => {
        if (!editingStepTitle.trim()) return;

        try {
            await updateStep.mutateAsync({
                stepId,
                procedureId,
                data: { title: editingStepTitle.trim() }
            });
            setEditingStepId(null);
            setEditingStepTitle('');
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Güncelleme başarısız.');
        }
    };

    const handleDeleteStep = (step: ProcedureStep) => {
        Alert.alert(
            'Adımı Sil',
            `"${step.title}" adımını silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteStep.mutateAsync({ stepId: step.id, procedureId });
                        } catch (error: any) {
                            Alert.alert('Hata', error.message || 'Silme başarısız.');
                        }
                    }
                }
            ]
        );
    };

    const startEditingStep = (step: ProcedureStep) => {
        setEditingStepId(step.id);
        setEditingStepTitle(step.title);
    };

    const onDragEnd = ({ data }: { data: ProcedureStep[] }) => {
        setSteps(data);
        setHasOrderChanged(true);
    };

    const renderHeader = () => (
        <View>
            {/* Status Banner */}
            {!isActive && (
                <View style={[styles.statusBanner, { backgroundColor: theme.warning + '20' }]}>
                    <Ionicons name="pause-circle" size={20} color={theme.warning} />
                    <Text variant="bodySmall" color={theme.warning}>Bu prosedür şu anda devre dışı</Text>
                </View>
            )}

            {/* Entity Info */}
            <Card style={styles.card}>
                <View style={styles.entityInfo}>
                    <View style={[styles.entityIcon, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="cube-outline" size={20} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text variant="caption" color={theme.textSecondary}>Bağlı Varlık</Text>
                        <Text variant="body" weight="500">{procedure.entity_name || 'Bilinmiyor'}</Text>
                    </View>
                </View>
            </Card>

            {/* Procedure Details */}
            <Card style={styles.card}>
                <Text variant="h3" style={styles.cardTitle}>Prosedür Bilgileri</Text>

                <View style={styles.inputGroup}>
                    <Text variant="bodySmall" weight="500" style={styles.label}>Başlık *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Prosedür başlığı"
                        placeholderTextColor={theme.textMuted}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text variant="bodySmall" weight="500" style={styles.label}>Açıklama</Text>
                    <TextInput
                        style={[styles.input, styles.multilineInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Prosedür açıklaması"
                        placeholderTextColor={theme.textMuted}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text variant="bodySmall" weight="500" style={styles.label}>Öncelik</Text>
                    <View style={styles.priorityOptions}>
                        {priorityOptions.map(opt => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.priorityOption,
                                    { borderColor: priority === opt.value ? opt.color : theme.border },
                                    priority === opt.value && { backgroundColor: opt.color + '20' }
                                ]}
                                onPress={() => setPriority(opt.value)}
                            >
                                <Text
                                    variant="caption"
                                    weight={priority === opt.value ? '600' : 'normal'}
                                    color={priority === opt.value ? opt.color : theme.text}
                                >
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text variant="bodySmall" weight="500" style={styles.label}>Tekrar Aralığı</Text>
                    <View style={styles.intervalRow}>
                        <TextInput
                            style={[styles.input, styles.intervalInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                            value={intervalValue}
                            onChangeText={setIntervalValue}
                            keyboardType="numeric"
                        />
                        <View style={styles.intervalUnits}>
                            {(['DAYS', 'WEEKS', 'MONTHS'] as const).map(unit => (
                                <TouchableOpacity
                                    key={unit}
                                    style={[
                                        styles.intervalUnit,
                                        { borderColor: intervalUnit === unit ? theme.primary : theme.border },
                                        intervalUnit === unit && { backgroundColor: theme.primaryLight }
                                    ]}
                                    onPress={() => setIntervalUnit(unit)}
                                >
                                    <Text
                                        variant="caption"
                                        color={intervalUnit === unit ? theme.primary : theme.text}
                                    >
                                        {unit === 'DAYS' ? 'Gün' : unit === 'WEEKS' ? 'Hafta' : 'Ay'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.toggleRow}
                    onPress={() => setRequiresApproval(!requiresApproval)}
                >
                    <View style={styles.toggleInfo}>
                        <Text variant="body">Onay Gerekli</Text>
                        <Text variant="caption" color={theme.textSecondary}>
                            Tamamlandığında yönetici onayı gerekir
                        </Text>
                    </View>
                    <View style={[styles.toggle, requiresApproval && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        {requiresApproval && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                </TouchableOpacity>

                <Button
                    title={hasOrderChanged ? "Değişiklikleri Kaydet (Sıralama Değişti)" : "Değişiklikleri Kaydet"}
                    variant="primary"
                    fullWidth
                    onPress={handleSave}
                    loading={updateProcedure.isPending || updateStep.isPending}
                    style={{ marginTop: Spacing.md }}
                />
            </Card>

            <View style={styles.cardHeader}>
                <Text variant="h3">Adımlar</Text>
                <Text variant="caption" color={theme.textSecondary}>{steps.length} adım</Text>
            </View>
        </View>
    );

    const renderFooter = () => (
        <View>
            {/* Add Step */}
            <Card style={[styles.card, { marginTop: Spacing.sm }]}>
                <View style={styles.addStepContainer}>
                    <TextInput
                        style={[styles.addStepInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                        value={newStepTitle}
                        onChangeText={setNewStepTitle}
                        placeholder="Yeni adım başlığı..."
                        placeholderTextColor={theme.textMuted}
                        onSubmitEditing={handleAddStep}
                    />
                    <TouchableOpacity
                        style={[styles.addStepButton, { backgroundColor: newStepTitle.trim() ? theme.primary : theme.textMuted }]}
                        onPress={handleAddStep}
                        disabled={!newStepTitle.trim() || createStep.isPending}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Card>

            {/* Status & Danger Zone */}
            <Card style={styles.card}>
                <Text variant="h3" style={styles.cardTitle}>Durum Yönetimi</Text>

                <Button
                    title={isActive ? 'Prosedürü Devre Dışı Bırak' : 'Prosedürü Aktif Et'}
                    variant={isActive ? 'outline' : 'primary'}
                    fullWidth
                    onPress={handleToggleActive}
                    loading={activateProcedure.isPending || deactivateProcedure.isPending}
                />

                <View style={[styles.dangerSection, { borderTopColor: theme.border }]}>
                    <Text variant="bodySmall" color={theme.error} weight="600">Tehlikeli Bölge</Text>
                    <Button
                        title="Prosedürü Sil"
                        variant="danger"
                        fullWidth
                        onPress={handleDelete}
                        loading={deleteProcedure.isPending}
                        style={{ marginTop: Spacing.sm }}
                    />
                </View>
            </Card>
        </View>
    );

    const renderStepItem = ({ item, drag, isActive, getIndex }: RenderItemParams<ProcedureStep>) => {
        const index = getIndex();
        return (
            <ScaleDecorator>
                <OpacityDecorator>
                    <ShadowDecorator>
                        <View style={[
                            styles.stepItem,
                            {
                                backgroundColor: isActive ? theme.background : theme.cardBackground,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.border,
                                elevation: isActive ? 5 : 0
                            }
                        ]}>
                            <TouchableOpacity
                                onLongPress={drag}
                                style={styles.dragHandle}
                            >
                                <Ionicons name="menu" size={24} color={theme.textMuted} />
                            </TouchableOpacity>

                            <View style={[styles.stepNumber, { backgroundColor: theme.primaryLight }]}>
                                <Text variant="bodySmall" weight="600" color={theme.primary}>
                                    {index !== undefined ? index + 1 : '-'}
                                </Text>
                            </View>

                            {editingStepId === item.id ? (
                                <View style={styles.stepEditRow}>
                                    <TextInput
                                        style={[styles.stepEditInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                                        value={editingStepTitle}
                                        onChangeText={setEditingStepTitle}
                                        autoFocus
                                    />
                                    <TouchableOpacity onPress={() => handleUpdateStep(item.id)}>
                                        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setEditingStepId(null)}>
                                        <Ionicons name="close-circle" size={24} color={theme.textMuted} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.stepInfo} onPress={() => startEditingStep(item)}>
                                        <Text variant="body">{item.title}</Text>
                                        {item.description && (
                                            <Text variant="caption" color={theme.textSecondary}>{item.description}</Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => startEditingStep(item)}>
                                        <Ionicons name="create-outline" size={18} color={theme.textMuted} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteStep(item)} style={{ marginLeft: Spacing.sm }}>
                                        <Ionicons name="trash-outline" size={18} color={theme.error} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </ShadowDecorator>
                </OpacityDecorator>
            </ScaleDecorator>
        );
    };

    return (
        <Screen padding={false} safeArea={false} style={{ backgroundColor: theme.backgroundSecondary }}>
            <Stack.Screen options={{ title: procedure?.title || 'Prosedür Düzenle' }} />
            <GestureHandlerRootView style={{ flex: 1 }}>
                <DraggableFlatList
                    data={steps}
                    onDragEnd={onDragEnd}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderStepItem}
                    ListHeaderComponent={renderHeader()}
                    ListFooterComponent={renderFooter()}
                    contentContainerStyle={styles.content}
                />
            </GestureHandlerRootView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.md,
        paddingBottom: 40,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: 10,
        marginBottom: Spacing.md,
    },
    card: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    cardTitle: {
        marginBottom: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xs,
    },
    entityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    entityIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
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
    priorityOptions: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    priorityOption: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
    },
    intervalRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    intervalInput: {
        width: 70,
        textAlign: 'center',
    },
    intervalUnits: {
        flexDirection: 'row',
        flex: 1,
        gap: Spacing.xs,
    },
    intervalUnit: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    toggleInfo: {
        flex: 1,
    },
    toggle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dragHandle: {
        paddingRight: Spacing.sm,
        justifyContent: 'center',
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.xs,
        borderRadius: 8,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    stepInfo: {
        flex: 1,
    },
    stepEditRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    stepEditInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        fontSize: 14,
    },
    addStepContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    addStepInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: 16,
    },
    addStepButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dangerSection: {
        borderTopWidth: 1,
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
    },
});

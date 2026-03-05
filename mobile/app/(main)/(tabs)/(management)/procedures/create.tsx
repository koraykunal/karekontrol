import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, TouchableOpacity, FlatList } from 'react-native';
import { useRouter, Redirect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams, ShadowDecorator, OpacityDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Screen } from '@/src/components/common/Screen';
import { Text } from '@/src/components/common/Text';
import { Button } from '@/src/components/common/Button';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { usePermissions, useCreateProcedure, useCreateStep } from '@/src/features/management';
import { useEntities } from '@/src/features/entities/hooks/queries';
import { ProcedurePriority } from '@/src/api/types/enums';
import { Entity } from '@/src/api/types/entity.types';

interface StepDraft {
    id: string;
    title: string;
    description: string;
    requires_photo: boolean;
    requires_notes: boolean;
}

const priorityOptions = [
    { value: ProcedurePriority.LOW, label: 'Düşük', color: '#10B981' },
    { value: ProcedurePriority.MEDIUM, label: 'Orta', color: '#F59E0B' },
    { value: ProcedurePriority.HIGH, label: 'Yüksek', color: '#EF4444' },
    { value: ProcedurePriority.CRITICAL, label: 'Kritik', color: '#DC2626' },
];

export default function ProcedureCreateScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { canManage, user, isAdmin } = usePermissions();

    const createProcedure = useCreateProcedure();
    const createStep = useCreateStep();

    // Fetch entities for selection
    const entityFilters = isAdmin ? {} : { department: user?.department ?? undefined };
    const { data: entitiesData } = useEntities(entityFilters);
    const entities: Entity[] = (entitiesData as any)?.data || (entitiesData as any)?.results || entitiesData || [];

    // Form state
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(
        params.entityId ? entities.find(e => e.id === Number(params.entityId)) || null : null
    );
    const [showEntityPicker, setShowEntityPicker] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<ProcedurePriority>(ProcedurePriority.MEDIUM);
    const [intervalValue, setIntervalValue] = useState('30');
    const [intervalUnit, setIntervalUnit] = useState<'DAYS' | 'WEEKS' | 'MONTHS'>('DAYS');
    const [requiresApproval, setRequiresApproval] = useState(false);

    // Steps
    const [steps, setSteps] = useState<StepDraft[]>([]);
    const [newStepTitle, setNewStepTitle] = useState('');

    // Update selected entity when entities load
    React.useEffect(() => {
        if (params.entityId && entities.length > 0 && !selectedEntity) {
            const found = entities.find(e => e.id === Number(params.entityId));
            if (found) setSelectedEntity(found);
        }
    }, [entities, params.entityId]);

    if (!canManage) {
        return <Redirect href="/(main)/(tabs)/(dashboard)" />;
    }

    const addStep = () => {
        if (!newStepTitle.trim()) return;

        setSteps(prev => [...prev, {
            id: Date.now().toString(),
            title: newStepTitle.trim(),
            description: '',
            requires_photo: false,
            requires_notes: false,
        }]);
        setNewStepTitle('');
    };

    const removeStep = (id: string) => {
        setSteps(prev => prev.filter(s => s.id !== id));
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Hata', 'Prosedür başlığı gereklidir.');
            return;
        }

        if (!selectedEntity) {
            Alert.alert('Hata', 'Lütfen bir varlık seçin.');
            return;
        }

        if (steps.length === 0) {
            Alert.alert('Hata', 'En az bir adım eklemelisiniz.');
            return;
        }

        try {
            // Create procedure
            const procedure = await createProcedure.mutateAsync({
                title: title.trim(),
                description: description.trim() || undefined,
                entity: selectedEntity.id,
                priority: priority.toUpperCase() as any,
                interval_value: parseInt(intervalValue) || 30,
                interval_unit: intervalUnit,
                requires_approval: requiresApproval,
            });

            // Create steps
            const procedureId = (procedure as any)?.data?.id || (procedure as any)?.id;
            if (procedureId) {
                for (let i = 0; i < steps.length; i++) {
                    await createStep.mutateAsync({
                        procedureId,
                        data: {
                            title: steps[i].title,
                            description: steps[i].description || undefined,
                            step_order: i + 1,
                            requires_photo: steps[i].requires_photo,
                        }
                    });
                }
            }

            Alert.alert('Başarılı', 'Prosedür ve adımlar oluşturuldu.', [
                { text: 'Tamam', onPress: () => router.canGoBack() ? router.back() : router.replace('/(main)/(tabs)/(management)/procedures') }
            ]);
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Oluşturma başarısız.');
        }
    };

    const renderEntityOption = ({ item }: { item: Entity }) => (
        <TouchableOpacity
            style={[styles.entityOption, { borderBottomColor: theme.border }]}
            onPress={() => {
                setSelectedEntity(item);
                setShowEntityPicker(false);
            }}
        >
            <View style={[styles.entityOptionIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="cube-outline" size={18} color={theme.primary} />
            </View>
            <View style={styles.entityOptionInfo}>
                <Text variant="body">{item.name}</Text>
                <Text variant="caption" color={theme.textSecondary}>{item.code}</Text>
            </View>
            {selectedEntity?.id === item.id && (
                <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
            )}
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View>
            {/* Entity Selection */}
            <Card style={styles.card}>
                <Text variant="h3" style={styles.cardTitle}>Varlık Seçimi *</Text>
                <TouchableOpacity
                    style={[styles.entitySelector, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                    onPress={() => setShowEntityPicker(!showEntityPicker)}
                >
                    {selectedEntity ? (
                        <View style={styles.selectedEntity}>
                            <View style={[styles.entityOptionIcon, { backgroundColor: theme.primaryLight }]}>
                                <Ionicons name="cube-outline" size={18} color={theme.primary} />
                            </View>
                            <View style={styles.entityOptionInfo}>
                                <Text variant="body" weight="500">{selectedEntity.name}</Text>
                                <Text variant="caption" color={theme.textSecondary}>{selectedEntity.code}</Text>
                            </View>
                        </View>
                    ) : (
                        <Text variant="body" color={theme.textMuted}>Varlık seçin...</Text>
                    )}
                    <Ionicons name={showEntityPicker ? "chevron-up" : "chevron-down"} size={20} color={theme.textMuted} />
                </TouchableOpacity>

                {showEntityPicker && (
                    <View style={[styles.entityList, { borderColor: theme.border }]}>
                        <FlatList
                            data={entities}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderEntityOption}
                            style={{ maxHeight: 200 }}
                        />
                    </View>
                )}
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
                            placeholder="30"
                            placeholderTextColor={theme.textMuted}
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
                    <View style={[styles.toggle, requiresApproval && { backgroundColor: theme.primary }]}>
                        {requiresApproval && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                </TouchableOpacity>
            </Card>

            <View style={styles.stepsHeader}>
                <Text variant="h3">Adımlar *</Text>
                <Text variant="caption" color={theme.textSecondary}>{steps.length} adım</Text>
            </View>

            {steps.length === 0 && (
                <Card style={[styles.card, styles.emptyStepsCard]}>
                    <Text color={theme.textMuted} style={{ textAlign: 'center' }}>Henüz adım eklenmedi</Text>
                </Card>
            )}
        </View>
    );

    const renderFooter = () => (
        <View>
            <Card style={styles.card}>
                <View style={styles.addStepRow}>
                    <TextInput
                        style={[styles.input, styles.addStepInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                        value={newStepTitle}
                        onChangeText={setNewStepTitle}
                        placeholder="Yeni adım başlığı..."
                        placeholderTextColor={theme.textMuted}
                        onSubmitEditing={addStep}
                    />
                    <TouchableOpacity
                        style={[styles.addStepButton, { backgroundColor: newStepTitle.trim() ? theme.primary : theme.textMuted }]}
                        onPress={addStep}
                        disabled={!newStepTitle.trim()}
                    >
                        <Ionicons name="add" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Card>

            <View style={styles.actions}>
                <Button
                    title="Prosedür Oluştur"
                    variant="primary"
                    fullWidth
                    onPress={handleCreate}
                    loading={createProcedure.isPending || createStep.isPending}
                    disabled={!selectedEntity || !title.trim() || steps.length === 0}
                />
                <Button
                    title="İptal"
                    variant="outline"
                    fullWidth
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(main)/(tabs)/(management)/procedures')}
                />
            </View>
        </View>
    );

    const renderStepItem = ({ item, drag, isActive, getIndex }: RenderItemParams<StepDraft>) => {
        const index = getIndex();
        return (
            <ScaleDecorator>
                <OpacityDecorator>
                    <ShadowDecorator>
                        <View style={[
                            styles.stepItem,
                            {
                                backgroundColor: isActive ? theme.background : theme.cardBackground,
                                borderColor: isActive ? theme.primary : theme.border,
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
                                <Text variant="bodySmall" weight="600" color={theme.primary}>{index !== undefined ? index + 1 : '-'}</Text>
                            </View>

                            <View style={styles.stepInfo}>
                                <Text variant="body">{item.title}</Text>
                            </View>

                            <TouchableOpacity onPress={() => removeStep(item.id)}>
                                <Ionicons name="close-circle" size={20} color={theme.error} />
                            </TouchableOpacity>
                        </View>
                    </ShadowDecorator>
                </OpacityDecorator>
            </ScaleDecorator>
        );
    };

    return (
        <Screen padding={false} safeArea={false} style={{ backgroundColor: theme.backgroundSecondary }}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <DraggableFlatList
                    data={steps}
                    onDragEnd={({ data }) => setSteps(data)}
                    keyExtractor={(item) => item.id}
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
    card: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    cardTitle: {
        marginBottom: Spacing.md,
    },
    stepsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xs,
    },
    emptyStepsCard: {
        padding: Spacing.lg,
        borderStyle: 'dashed',
        borderWidth: 1,
        alignItems: 'center',
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
    entitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 10,
        padding: Spacing.md,
    },
    selectedEntity: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    entityList: {
        borderWidth: 1,
        borderRadius: 10,
        marginTop: Spacing.sm,
        overflow: 'hidden',
    },
    entityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    entityOptionIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    entityOptionInfo: {
        flex: 1,
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
        paddingTop: Spacing.sm,
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
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: 10,
        borderWidth: 1,
    },
    dragHandle: {
        paddingRight: Spacing.sm,
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
    addStepRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    addStepInput: {
        flex: 1,
    },
    addStepButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        gap: Spacing.sm,
    },
});

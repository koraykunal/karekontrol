import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/src/components/common/Screen';
import { Text } from '@/src/components/common/Text';
import { Button } from '@/src/components/common/Button';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import {
    usePermissions,
    useUser,
    useUpdateUser,
    useUpdateUserRole,
    useActivateUser,
    useDeactivateUser,
    useDepartments,
} from '@/src/features/management';
import { UserRole } from '@/src/api/types/enums';

const roleLabels: Record<string, string> = {
    super_admin: 'Süper Admin',
    admin: 'Yönetici',
    manager: 'Departman Müdürü',
    worker: 'Çalışan',
};

const roleOptions: { value: UserRole; label: string }[] = [
    { value: UserRole.WORKER, label: 'Çalışan' },
    { value: UserRole.MANAGER, label: 'Departman Müdürü' },
    { value: UserRole.ADMIN, label: 'Yönetici' },
];

export default function UserEditScreen() {
    const { id } = useLocalSearchParams();
    const userId = Number(id);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { canManageUsers, canChangeRoles, getAssignableRoles, user: currentUser } = usePermissions();

    const { data: userData, isLoading } = useUser(userId);
    const targetUser = (userData as any)?.data || userData;

    // Based on previous file content: const { data: departmentsData } = useDepartments();
    // Re-checking useDepartments usage in previous snippet: 
    // const { data: departmentsData } = useDepartments();
    // const departments = (departmentsData as any)?.data || departmentsData || [];

    // I need to be careful about imports as well.
    const { data: departmentsData } = useDepartments();
    const departments = (departmentsData as any)?.data || departmentsData || [];

    const updateUser = useUpdateUser();
    const updateRole = useUpdateUserRole();
    const activateUser = useActivateUser();
    const deactivateUser = useDeactivateUser();

    // Form state
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);

    useEffect(() => {
        if (targetUser) {
            setFullName(targetUser.full_name || '');
            setPhone(targetUser.phone || '');
            setSelectedDepartment(targetUser.department || null);
        }
    }, [targetUser]);

    if (!canManageUsers) {
        return <Redirect href="/(main)/(tabs)/(dashboard)" />;
    }

    if (isLoading) {
        return (
            <Screen center style={{ backgroundColor: theme.backgroundSecondary }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </Screen>
        );
    }

    if (!targetUser) {
        return (
            <Screen center style={{ backgroundColor: theme.backgroundSecondary }}>
                <Text>Kullanıcı bulunamadı</Text>
            </Screen>
        );
    }

    const isSelf = currentUser?.id === targetUser.id;
    const assignableRoles = getAssignableRoles();

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Hata', 'Ad soyad gereklidir.');
            return;
        }

        try {
            await updateUser.mutateAsync({
                id: userId,
                data: {
                    full_name: fullName.trim(),
                    phone: phone.trim() || undefined,
                    department: selectedDepartment || undefined,
                }
            });
            Alert.alert('Başarılı', 'Kullanıcı bilgileri güncellendi.');
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Güncelleme başarısız.');
        }
    };

    const handleRoleChange = (newRole: UserRole) => {
        if (isSelf) {
            Alert.alert('Uyarı', 'Kendi rolünüzü değiştiremezsiniz.');
            return;
        }

        Alert.alert(
            'Rol Değiştir',
            `Bu kullanıcının rolünü "${roleLabels[newRole]}" olarak değiştirmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Değiştir',
                    onPress: async () => {
                        try {
                            await updateRole.mutateAsync({ id: userId, role: newRole });
                            Alert.alert('Başarılı', 'Rol güncellendi.');
                        } catch (error: any) {
                            Alert.alert('Hata', error.message || 'Rol değiştirilemedi.');
                        }
                    }
                }
            ]
        );
    };

    const handleToggleActive = () => {
        if (isSelf) {
            Alert.alert('Uyarı', 'Kendinizi devre dışı bırakamazsınız.');
            return;
        }

        const action = targetUser.is_active ? 'devre dışı bırakmak' : 'aktif etmek';
        Alert.alert(
            'Kullanıcı Durumu',
            `Bu kullanıcıyı ${action} istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Onayla',
                    style: targetUser.is_active ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            if (targetUser.is_active) {
                                await deactivateUser.mutateAsync(userId);
                            } else {
                                await activateUser.mutateAsync(userId);
                            }
                        } catch (error: any) {
                            Alert.alert('Hata', error.message || 'İşlem başarısız.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <Screen padding={false} safeArea={false} style={{ backgroundColor: theme.backgroundSecondary }}>
            <Stack.Screen options={{ title: targetUser.full_name }} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* User Info Card */}
                <Card style={styles.card}>
                    <View style={styles.userHeader}>
                        <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                            <Text variant="h2" color={theme.primary}>
                                {targetUser.full_name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.userInfo}>
                            <Text variant="h3">{targetUser.full_name}</Text>
                            <Text variant="body" color={theme.textSecondary}>{targetUser.email}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: targetUser.is_active ? '#10B98120' : '#EF444420' }]}>
                                <Text variant="caption" color={targetUser.is_active ? '#10B981' : '#EF4444'}>
                                    {targetUser.is_active ? 'Aktif' : 'Pasif'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Edit Form */}
                <Card style={styles.card}>
                    <Text variant="h3" style={styles.cardTitle}>Bilgileri Düzenle</Text>

                    <View style={styles.inputGroup}>
                        <Text variant="bodySmall" weight="500" style={styles.label}>Ad Soyad *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Ad soyad"
                            placeholderTextColor={theme.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text variant="bodySmall" weight="500" style={styles.label}>Telefon</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Telefon numarası"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <Button
                        title="Değişiklikleri Kaydet"
                        variant="primary"
                        fullWidth
                        onPress={handleSave}
                        loading={updateUser.isPending}
                    />
                </Card>

                {/* Department Management */}
                {canChangeRoles && !isSelf && (
                    <Card style={styles.card}>
                        <Text variant="h3" style={styles.cardTitle}>Departman</Text>
                        <Text variant="caption" color={theme.textSecondary} style={{ marginBottom: Spacing.md }}>
                            Mevcut: {targetUser.department_name || 'Atanmamış'}
                        </Text>

                        <View style={styles.departmentList}>
                            {departments.map((dept: any) => (
                                <TouchableOpacity
                                    key={dept.id}
                                    style={[
                                        styles.departmentOption,
                                        { borderColor: theme.border },
                                        selectedDepartment === dept.id && { backgroundColor: theme.primaryLight, borderColor: theme.primary }
                                    ]}
                                    onPress={() => setSelectedDepartment(dept.id)}
                                >
                                    <Text
                                        variant="bodySmall"
                                        color={selectedDepartment === dept.id ? theme.primary : theme.text}
                                        weight={selectedDepartment === dept.id ? '600' : 'normal'}
                                    >
                                        {dept.name}
                                    </Text>
                                    {selectedDepartment === dept.id && (
                                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Card>
                )}

                {/* Role Management - Admin Only */}
                {canChangeRoles && !isSelf && (
                    <Card style={styles.card}>
                        <Text variant="h3" style={styles.cardTitle}>Rol Yönetimi</Text>
                        <Text variant="caption" color={theme.textSecondary} style={{ marginBottom: Spacing.md }}>
                            Mevcut rol: {roleLabels[targetUser.role] || targetUser.role}
                        </Text>

                        <View style={styles.roleButtons}>
                            {assignableRoles.map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    style={[
                                        styles.roleButton,
                                        { borderColor: theme.border },
                                        targetUser.role === role && { backgroundColor: theme.primaryLight, borderColor: theme.primary }
                                    ]}
                                    onPress={() => handleRoleChange(role)}
                                    disabled={targetUser.role === role}
                                >
                                    <Text
                                        variant="bodySmall"
                                        color={targetUser.role === role ? theme.primary : theme.text}
                                        weight={targetUser.role === role ? '600' : 'normal'}
                                    >
                                        {roleLabels[role]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Card>
                )}

                {/* Activate/Deactivate - Admin Only */}
                {canChangeRoles && !isSelf && (
                    <Card style={styles.card}>
                        <Text variant="h3" style={styles.cardTitle}>Hesap Durumu</Text>
                        <Button
                            title={targetUser.is_active ? 'Hesabı Devre Dışı Bırak' : 'Hesabı Aktif Et'}
                            variant={targetUser.is_active ? 'danger' : 'primary'}
                            fullWidth
                            onPress={handleToggleActive}
                            loading={activateUser.isPending || deactivateUser.isPending}
                        />
                    </Card>
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
    card: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    cardTitle: {
        marginBottom: Spacing.md,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    userInfo: {
        flex: 1,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
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
    roleButtons: {
        gap: Spacing.sm,
    },
    roleButton: {
        padding: Spacing.md,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    departmentList: {
        gap: Spacing.sm,
    },
    departmentOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: 10,
        borderWidth: 1,
    },
});

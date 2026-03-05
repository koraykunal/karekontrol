import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Switch} from 'react-native';
import {Stack, Redirect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';

import {Screen} from '@/src/components/common/Screen';
import {Text} from '@/src/components/common/Text';
import {Card} from '@/src/components/common/Card';
import {Button} from '@/src/components/common/Button';
import {Colors, Spacing} from '@/src/constants/theme';
import {useColorScheme} from '@/src/hooks/use-color-scheme';
import {usePermissions} from '@/src/features/management';
import {authService} from '@/src/api/services/auth.service';
import {useAuthStore} from '@/src/store/zustand/auth.store';
import api from '@/src/api/client';
import type {PermissionScope} from '@/src/types/permissions.generated';

interface PermissionConfig {
    enabled: boolean;
    scope?: PermissionScope;
}

interface PermissionSchema {
    permissions: { key: string; label: string }[];
    scopes: { key: string; label: string }[];
    roles: { key: string; label: string }[];
}

const SCOPE_LABELS: Record<string, string> = {
    OWN: 'Sadece Kendi',
    DEPARTMENT: 'Departman',
    ORGANIZATION: 'Organizasyon',
    ALL: 'Tümü'
};

const PERMISSIONS_WITH_SCOPE = [
    'view_entities', 'edit_entities', 'delete_entities',
    'view_users', 'edit_users', 'delete_users',
    'view_procedures', 'edit_procedures', 'delete_procedures',
    'view_executions', 'edit_executions',
    'view_issues', 'edit_issues',
    'view_departments', 'view_organizations',
    'access_reports', 'view_analytics'
];

export default function PermissionsScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const {canAccessManagement} = usePermissions();
    const user = useAuthStore(state => state.user);
    const queryClient = useQueryClient();

    const [selectedRole, setSelectedRole] = useState<string>('MANAGER');
    const [permissions, setPermissions] = useState<Record<string, PermissionConfig>>({});
    const [hasChanges, setHasChanges] = useState(false);

    const {data: schema, isLoading: schemaLoading} = useQuery<PermissionSchema>({
        queryKey: ['permission-schema'],
        queryFn: async () => {
            const response = await api.get('/permissions/policies/schema/');
            return response.data;
        }
    });

    const {data: defaultsData} = useQuery({
        queryKey: ['permission-defaults', selectedRole],
        queryFn: async () => {
            const response = await api.get('/permissions/policies/defaults/', {
                params: {role: selectedRole}
            });
            return response.data;
        },
        enabled: !!selectedRole
    });

    const saveMutation = useMutation({
        mutationFn: async (data: { role: string; permissions: Record<string, PermissionConfig> }) => {
            return api.post('/permissions/policies/save/', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['permission-defaults']});
            setHasChanges(false);
        }
    });

    useEffect(() => {
        if (defaultsData?.permissions) {
            setPermissions(defaultsData.permissions);
            setHasChanges(false);
        }
    }, [defaultsData, selectedRole]);

    if (!user) {
        return <Redirect href="/(auth)/login"/>;
    }

    if (!canAccessManagement) {
        return <Redirect href="/(main)/(tabs)/(dashboard)"/>;
    }

    if (schemaLoading) {
        return (
            <Screen center style={{backgroundColor: theme.backgroundSecondary}}>
                <ActivityIndicator size="large" color={theme.primary}/>
            </Screen>
        );
    }

    const handleToggle = (key: string, value: boolean) => {
        setPermissions(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                enabled: value,
                scope: value && PERMISSIONS_WITH_SCOPE.includes(key)
                    ? (prev[key]?.scope || 'DEPARTMENT')
                    : prev[key]?.scope
            }
        }));
        setHasChanges(true);
    };

    const handleScopeChange = (key: string, scope: PermissionScope) => {
        setPermissions(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                scope
            }
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await saveMutation.mutateAsync({
                role: selectedRole,
                permissions
            });

            if (user?.role === selectedRole) {
                try {
                    const meResponse = await authService.getMe();
                    const updatedUser = (meResponse as any).data || meResponse;
                    if (updatedUser?.id) {
                        useAuthStore.getState().updateUser(updatedUser);
                    }
                } catch (err) {
                    console.error('Failed to refresh user profile', err);
                }
            }

            Alert.alert('Başarılı', 'İzinler kaydedildi.');
        } catch (error: any) {
            Alert.alert('Hata', error.response?.data?.error || 'İzinler kaydedilemedi.');
        }
    };

    const roles = schema?.roles || [];

    return (
        <Screen padding={false} safeArea={false} style={{backgroundColor: theme.backgroundSecondary}}>
            <Stack.Screen options={{title: 'İzin Yönetimi'}}/>

            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.card}>
                    <Text variant="h3" style={styles.cardTitle}>Rol Seçin</Text>
                    <View style={styles.roleSelector}>
                        {roles.map((role: any) => (
                            <TouchableOpacity
                                key={role.key}
                                style={[
                                    styles.roleTab,
                                    {borderColor: theme.border},
                                    selectedRole === role.key && {
                                        backgroundColor: theme.primaryLight,
                                        borderColor: theme.primary
                                    }
                                ]}
                                onPress={() => setSelectedRole(role.key)}
                            >
                                <Text
                                    weight={selectedRole === role.key ? '600' : 'normal'}
                                    color={selectedRole === role.key ? theme.primary : theme.text}
                                    style={styles.roleTabText}
                                >
                                    {role.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card>

                <Card style={styles.card}>
                    <View style={styles.resourceHeader}>
                        <Ionicons name="shield-checkmark" size={20} color={theme.primary}/>
                        <Text variant="h3" style={{marginLeft: 8}}>İzinler</Text>
                    </View>

                    <Text variant="bodySmall" color={theme.textSecondary} style={{marginBottom: Spacing.md}}>
                        Seçili rol için izinleri yapılandırın. İzin açıksa kapsam (scope) seçebilirsiniz.
                    </Text>

                    {schema?.permissions.map((perm: any, index: number) => {
                        const isEnabled = permissions[perm.key]?.enabled || false;
                        const hasScope = PERMISSIONS_WITH_SCOPE.includes(perm.key);
                        const currentScope = permissions[perm.key]?.scope;

                        return (
                            <View key={perm.key}>
                                <View
                                    style={[
                                        styles.toggleRow,
                                        {borderTopColor: theme.border},
                                        index === 0 && {borderTopWidth: 0}
                                    ]}
                                >
                                    <View style={{flex: 1, paddingRight: Spacing.md}}>
                                        <Text variant="body" weight="600">{perm.label}</Text>
                                    </View>
                                    <Switch
                                        value={isEnabled}
                                        onValueChange={(val) => handleToggle(perm.key, val)}
                                        trackColor={{false: theme.border, true: theme.primary}}
                                        thumbColor={'#fff'}
                                    />
                                </View>

                                {isEnabled && hasScope && (
                                    <View style={[styles.scopeSelector, {backgroundColor: theme.backgroundSecondary}]}>
                                        <Text variant="caption" color={theme.textSecondary}
                                              style={{marginBottom: Spacing.xs}}>
                                            Kapsam:
                                        </Text>
                                        <View style={styles.scopeButtons}>
                                            {['DEPARTMENT', 'ORGANIZATION', 'ALL'].map((scope) => (
                                                <TouchableOpacity
                                                    key={scope}
                                                    style={[
                                                        styles.scopeButton,
                                                        {
                                                            borderColor: theme.border,
                                                            backgroundColor: currentScope === scope ? theme.primary : 'transparent'
                                                        }
                                                    ]}
                                                    onPress={() => handleScopeChange(perm.key, scope as PermissionScope)}
                                                >
                                                    <Text
                                                        variant="caption"
                                                        color={currentScope === scope ? '#fff' : theme.text}
                                                    >
                                                        {SCOPE_LABELS[scope]}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </Card>

                {hasChanges && (
                    <View style={styles.saveContainer}>
                        <Button
                            title="Değişiklikleri Kaydet"
                            variant="primary"
                            fullWidth
                            onPress={handleSave}
                            loading={saveMutation.isPending}
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
    card: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    cardTitle: {
        marginBottom: Spacing.md,
    },
    roleSelector: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    roleTab: {
        flex: 1,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xs,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    roleTabText: {
        fontSize: 12,
        textAlign: 'center',
    },
    resourceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
    },
    scopeSelector: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: 8,
    },
    scopeButtons: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    scopeButton: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: 6,
        borderWidth: 1,
    },
    saveContainer: {
        marginTop: Spacing.md,
    },
});

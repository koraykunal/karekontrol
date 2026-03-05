import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/src/components/common/Text';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ProfileHeaderProps {
    fullName?: string;
    email?: string;
    role?: string;
}

export function ProfileHeader({ fullName, email, role }: ProfileHeaderProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const getRoleBadgeColor = (userRole?: string) => {
        switch (userRole?.toLowerCase()) {
            case 'super_admin': return '#ef4444';
            case 'admin': return '#f97316';
            case 'manager': return '#3b82f6';
            case 'worker': return '#22c55e';
            default: return '#6b7280';
        }
    };

    return (
        <View style={[styles.header, { backgroundColor: theme.background }]}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
                <Text style={[styles.avatarText, { color: theme.background }]}>
                    {fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
            </View>
            <Text style={[styles.name, { color: theme.text }]}>{fullName || 'Kullanıcı'}</Text>
            <Text style={[styles.email, { color: theme.textSecondary }]}>{email || 'email@example.com'}</Text>

            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(role) }]}>
                <Text style={[styles.roleText, { color: theme.background }]}>{role?.replace('_', ' ').toUpperCase() || 'USER'}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        marginBottom: 12,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});

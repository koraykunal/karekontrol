import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/src/components/common/Text';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

interface ProfileInfoProps {
    organizationName?: string | null;
    phone?: string | null;
    departmentName?: string | null;
}

export function ProfileInfo({ organizationName, phone, departmentName }: ProfileInfoProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.section, { backgroundColor: theme.background }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Genel Bilgiler</Text>

            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Organizasyon</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{organizationName || '-'}</Text>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Telefon</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{phone || '-'}</Text>
            </View>

            {departmentName && (
                <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Departman</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{departmentName}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    infoLabel: {
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
    },
});

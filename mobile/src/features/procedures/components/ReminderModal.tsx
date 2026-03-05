import React, { useState } from 'react';
import {
    View,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Text } from '@/src/components/common/Text';
import { Colors } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

interface ExistingReminder {
    id: number;
    remind_at: string;
    message: string;
}

interface ReminderModalProps {
    visible: boolean;
    onClose: () => void;
    onSetReminder: (remindAt: Date, message: string) => void;
    onDeleteReminder?: () => void;
    existingReminder?: ExistingReminder | null;
    stepTitle?: string;
}

const QUICK_OPTIONS = [
    { label: '30 dk', minutes: 30 },
    { label: '1 saat', minutes: 60 },
    { label: '2 saat', minutes: 120 },
    { label: '4 saat', minutes: 240 },
    { label: 'Yarın', minutes: 24 * 60 },
];

export const ReminderModal: React.FC<ReminderModalProps> = ({
    visible,
    onClose,
    onSetReminder,
    onDeleteReminder,
    existingReminder,
    stepTitle,
}) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [customDate, setCustomDate] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    const handleQuickOption = (minutes: number) => {
        const remindAt = new Date();
        remindAt.setMinutes(remindAt.getMinutes() + minutes);
        const message = stepTitle
            ? `${stepTitle} adımını tamamlamayı unutma!`
            : 'Adımı tamamlamayı unutma!';
        onSetReminder(remindAt, message);
        onClose();
    };

    const handleCustomDateTime = () => {
        const message = stepTitle
            ? `${stepTitle} adımını tamamlamayı unutma!`
            : 'Adımı tamamlamayı unutma!';
        onSetReminder(customDate, message);
        onClose();
        setShowCustomPicker(false);
    };

    const handleDelete = () => {
        if (onDeleteReminder) {
            onDeleteReminder();
        }
        onClose();
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowCustomPicker(false);
            if (selectedDate) {
                setCustomDate(selectedDate);
                setShowTimePicker(true);
            }
        } else {
            if (selectedDate) {
                setCustomDate(selectedDate);
            }
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDate = new Date(customDate);
            newDate.setHours(selectedTime.getHours());
            newDate.setMinutes(selectedTime.getMinutes());
            setCustomDate(newDate);
        }
    };

    const formatReminderTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('tr-TR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const styles = createStyles(theme);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text variant="body" weight="600" color={theme.text}>
                            Hatırlatıcı {existingReminder ? 'Düzenle' : 'Kur'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {stepTitle && (
                        <Text variant="caption" color={theme.textSecondary} style={styles.stepTitle}>
                            {stepTitle}
                        </Text>
                    )}

                    {existingReminder && (
                        <View style={styles.existingReminderCard}>
                            <View style={styles.existingReminderContent}>
                                <MaterialIcons name="alarm-on" size={24} color={theme.success} />
                                <View style={styles.existingReminderText}>
                                    <Text variant="body" weight="500" color={theme.text}>
                                        Aktif Hatırlatıcı
                                    </Text>
                                    <Text variant="caption" color={theme.textSecondary}>
                                        {formatReminderTime(existingReminder.remind_at)}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={handleDelete}
                            >
                                <MaterialIcons name="delete-outline" size={22} color={theme.error} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text variant="caption" color={theme.textSecondary} style={styles.sectionTitle}>
                        {existingReminder ? 'Yeni zaman seç:' : 'Hızlı seçenekler:'}
                    </Text>

                    <View style={styles.quickOptions}>
                        {QUICK_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.label}
                                style={styles.quickButton}
                                onPress={() => handleQuickOption(option.minutes)}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name="alarm"
                                    size={18}
                                    color={theme.primary}
                                    style={styles.quickIcon}
                                />
                                <Text variant="body" weight="500" color={theme.text}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.customButton}
                        onPress={() => setShowCustomPicker(true)}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="schedule" size={24} color={theme.primary} />
                        <Text variant="body" weight="500" color={theme.text} style={styles.customText}>
                            Özel Saat Seç
                        </Text>
                        <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {showCustomPicker && Platform.OS === 'ios' && (
                        <View style={styles.pickerContainer}>
                            <DateTimePicker
                                value={customDate}
                                mode="datetime"
                                display="spinner"
                                onChange={onDateChange}
                                minimumDate={new Date()}
                                locale="tr-TR"
                            />
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleCustomDateTime}
                            >
                                <Text variant="body" weight="600" color="#FFF">
                                    Hatırlatıcı Kur
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {showCustomPicker && Platform.OS === 'android' && (
                        <DateTimePicker
                            value={customDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            minimumDate={new Date()}
                        />
                    )}

                    {showTimePicker && Platform.OS === 'android' && (
                        <DateTimePicker
                            value={customDate}
                            mode="time"
                            display="default"
                            onChange={onTimeChange}
                        />
                    )}

                    {Platform.OS === 'android' && customDate > new Date() && !showCustomPicker && !showTimePicker && (
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleCustomDateTime}
                        >
                            <Text variant="body" weight="600" color="#FFF">
                                {customDate.toLocaleString('tr-TR')} için Kur
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const createStyles = (theme: typeof Colors.light) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        container: {
            backgroundColor: theme.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 40,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        closeButton: {
            padding: 4,
        },
        stepTitle: {
            marginBottom: 16,
        },
        sectionTitle: {
            marginBottom: 12,
            marginTop: 4,
        },
        existingReminderCard: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.backgroundSecondary,
            padding: 14,
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.success,
        },
        existingReminderContent: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        existingReminderText: {
            marginLeft: 12,
        },
        deleteButton: {
            padding: 8,
        },
        quickOptions: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 20,
        },
        quickButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.backgroundSecondary,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
        },
        quickIcon: {
            marginRight: 6,
        },
        divider: {
            height: 1,
            backgroundColor: theme.border,
            marginVertical: 16,
        },
        customButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.backgroundSecondary,
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
        },
        customText: {
            flex: 1,
            marginLeft: 12,
        },
        pickerContainer: {
            marginTop: 16,
        },
        confirmButton: {
            backgroundColor: theme.primary,
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 16,
        },
    });

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export const Colors = {
    light: {
        text: '#1f2937',
        textSecondary: '#6b7280',
        textMuted: '#9ca3af',
        background: '#ffffff',
        backgroundSecondary: '#f3f4f6',
        tint: tintColorLight,
        tabIconDefault: '#ccc',
        tabIconSelected: tintColorLight,

        // Brand Colors
        primary: '#3b82f6', // blue-500
        primaryDark: '#2563eb', // blue-600
        primaryLight: '#eff6ff', // blue-50

        secondary: '#10b981', // emerald-500

        // State Colors
        success: '#22c55e', // green-500
        successLight: '#dcfce7', // green-100
        warning: '#f59e0b', // amber-500
        error: '#ef4444', // red-500
        errorLight: '#fee2e2', // red-100
        info: '#3b82f6', // blue-500

        border: '#e5e7eb',
        inputBackground: '#f9fafb',

        // Components
        cardBackground: '#ffffff',

        // Action Backgrounds
        actionEntityBackground: '#f0fdf4',
        actionErrorBackground: '#fef2f2',
    },
    dark: {
        text: '#f9fafb',
        textSecondary: '#9ca3af',
        textMuted: '#6b7280',
        background: '#111827',
        backgroundSecondary: '#1f2937',
        tint: tintColorDark,
        tabIconDefault: '#ccc',
        tabIconSelected: tintColorDark,

        primary: '#3b82f6',
        primaryDark: '#60a5fa',
        primaryLight: '#1e3a8a',

        secondary: '#10b981',

        success: '#22c55e',
        successLight: '#14532d', // green-900
        warning: '#f59e0b',
        error: '#ef4444',
        errorLight: '#7f1d1d', // red-900
        info: '#3b82f6',

        border: '#374151',
        inputBackground: '#1f2937',

        cardBackground: '#1f2937',

        // Action Backgrounds
        actionEntityBackground: '#064e3b',
        actionErrorBackground: '#7f1d1d',
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
};

export const BorderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
};

export const Typography = {
    h1: {
        fontSize: 24,
        fontWeight: '700' as const,
        lineHeight: 34,
    },
    h2: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 30,
    },
    h3: {
        fontSize: 18,
        fontWeight: '600' as const,
        lineHeight: 26,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
    },
    bodySmall: {
        fontSize: 14,
        lineHeight: 20,
    },
    caption: {
        fontSize: 12,
        lineHeight: 16,
        color: '#6b7280',
    },
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
};

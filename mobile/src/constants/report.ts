import { ReportStatus } from '@/src/api/types/enums';

export const REPORT_STATUS_COLORS: Record<string, string> = {
    [ReportStatus.PENDING]: '#6b7280',
    [ReportStatus.GENERATING]: '#3b82f6',
    [ReportStatus.COMPLETED]: '#22c55e',
    [ReportStatus.FAILED]: '#ef4444',
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
    [ReportStatus.PENDING]: 'Bekliyor',
    [ReportStatus.GENERATING]: 'Oluşturuluyor',
    [ReportStatus.COMPLETED]: 'Tamamlandı',
    [ReportStatus.FAILED]: 'Başarısız',
};

export const REPORT_TYPE_LABELS: Record<string, string> = {
    PROCEDURE: 'Prosedür Raporu',
    ORGANIZATION: 'Organizasyon Raporu',
    DEPARTMENT: 'Departman Raporu',
    COMPLIANCE: 'Uyumluluk Raporu',
};

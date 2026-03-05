import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Text } from '@/src/components/common/Text';
import { Colors, BorderRadius } from '@/src/constants/theme';
import { entityService } from '@/src/api/services/entity.service';
import { createTaggedLogger } from '@/src/utils/logger';

const logger = createTaggedLogger('QRScanner');

function extractEntityCode(data: string): string {
    if (data.startsWith('http')) {
        try {
            const url = new URL(data);
            const segments = url.pathname.split('/').filter(Boolean);
            const entSegment = segments.find(s => s.startsWith('ENT-'));
            if (entSegment) return entSegment;
            const code = url.searchParams.get('code');
            if (code) return code;
        } catch {
        }
    }
    return data;
}

interface Props {
    height: number;
}

export function QRScanner({ height }: Props) {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const isScanning = useRef(false);

    useEffect(() => {
        isScanning.current = false;
    }, []);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (isScanning.current) return;
        isScanning.current = true;

        const entityCode = extractEntityCode(data);

        Alert.alert("QR Bulundu", `${entityCode}\n\nDetay sayfasına gidilsin mi?`, [
            {
                text: "İptal",
                style: "cancel",
                onPress: () => {
                    setTimeout(() => isScanning.current = false, 1000);
                }
            },
            {
                text: "Git",
                onPress: async () => {
                    try {
                        const response = await entityService.scanQr(entityCode);
                        logger.debug('QR Response:', JSON.stringify(response));

                        const entity = response.data;

                        if (entity && entity.id) {
                            router.push(`/(main)/(entities)/${entity.id}`);
                        } else {
                            Alert.alert("Bulunamadı", "Bu QR koduna sahip bir varlık bulunamadı.");
                        }
                    } catch (error) {
                        logger.error('QR Scan Error:', error);
                        Alert.alert("Hata", "Varlık sorgulanırken bir hata oluştu.");
                    } finally {
                        setTimeout(() => isScanning.current = false, 1000);
                    }
                }
            }
        ]);
    };

    if (!permission?.granted) {
        return (
            <View style={[styles.container, { height }, styles.noPermission]}>
                <Text style={{ marginBottom: 8 }}>Kamera izni gerekiyor</Text>
                <TouchableOpacity onPress={requestPermission}>
                    <Text color={Colors.light.primary} weight="600">İzin Ver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { height }]}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.scanFrame} />
                    <Text style={styles.scanText}>QR Kodu Okutun</Text>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    camera: {
        flex: 1,
    },
    noPermission: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.backgroundSecondary,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 220,
        height: 220,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: BorderRadius.lg,
        backgroundColor: 'transparent',
    },
    scanText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 14,
        fontWeight: '600',
    },
});

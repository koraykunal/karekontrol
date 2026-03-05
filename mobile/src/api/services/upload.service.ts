import { apiClient } from '../client';
import type { ApiResponse } from '../types/common.types';

export interface UploadResponse {
    success: boolean;
    url: string;
    filename: string;
    size: number;
    content_type: string;
}

export const uploadService = {
    uploadMedia: async (uri: string, mediaType: 'photo' | 'video', category: string = 'step_log'): Promise<UploadResponse> => {
        const formData = new FormData();

        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1];

        let fileType: string;
        if (mediaType === 'video') {
            if (fileName.endsWith('.mov')) {
                fileType = 'video/quicktime';
            } else if (fileName.endsWith('.mp4')) {
                fileType = 'video/mp4';
            } else {
                fileType = 'video/mp4';
            }
        } else {
            fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
        }

        formData.append('file', {
            uri: uri,
            name: fileName,
            type: fileType,
        } as any);

        formData.append('category', mediaType === 'video' ? 'videos' : category);

        const response = await apiClient.post<UploadResponse>('/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            transformRequest: (data) => data,
        });

        return response.data;
    },

    uploadImage: async (uri: string, category: string = 'step_log'): Promise<UploadResponse> => {
        return uploadService.uploadMedia(uri, 'photo', category);
    },
};

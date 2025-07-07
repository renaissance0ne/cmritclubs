import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFiles } from '@/lib/uploadthing';

export interface UploadResult {
    url: string;
    name: string;
    size: number;
}

export interface UseAuthenticatedUploadOptions {
    onClientUploadComplete?: (res: UploadResult[]) => void;
    onUploadError?: (error: Error) => void;
}

export const useAuthenticatedUpload = (
    endpoint: "proofOfLeadership",
    options?: UseAuthenticatedUploadOptions
) => {
    const { getToken } = useAuth();

    const startUpload = useCallback(async (files: File[]): Promise<UploadResult[]> => {
        try {
            // Get the Firebase ID token
            const token = await getToken();
            
            if (!token) {
                throw new Error('Authentication required. Please sign in first.');
            }

            // Use the uploadFiles function with custom headers
            const result = await uploadFiles(endpoint, {
                files,
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            // Transform the result to match our UploadResult interface
            const uploadResults: UploadResult[] = result.map((file: any) => ({
                url: file.url,
                name: file.name,
                size: file.size,
            }));

            // Call the success callback if provided
            if (options?.onClientUploadComplete) {
                options.onClientUploadComplete(uploadResults);
            }

            return uploadResults;
        } catch (error) {
            const uploadError = error instanceof Error ? error : new Error('Upload failed');
            
            // Call the error callback if provided
            if (options?.onUploadError) {
                options.onUploadError(uploadError);
            }
            
            throw uploadError;
        }
    }, [endpoint, getToken, options]);

    return {
        startUpload,
        isUploading: false, // We'll manage this state in the component
    };
};
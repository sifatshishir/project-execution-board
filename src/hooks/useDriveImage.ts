import { useState, useEffect } from 'react';
import { useAuthStore } from '@/auth/store';

export function useDriveImage(fileId?: string | null, fallbackUrl?: string) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const accessToken = useAuthStore((state) => state.accessToken);

    useEffect(() => {
        if (!fileId || !accessToken) {
            setImageUrl(fallbackUrl || null);
            return;
        }

        let isMounted = true;
        setLoading(true);

        const fetchImage = async () => {
            try {
                const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (!res.ok) throw new Error('Failed to fetch image');

                const blob = await res.blob();
                const url = URL.createObjectURL(blob);

                if (isMounted) {
                    setImageUrl(url);
                }
            } catch (err) {
                console.error('Error fetching drive image:', err);
                if (isMounted) setImageUrl(fallbackUrl || null);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
            if (imageUrl && imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [fileId, accessToken, fallbackUrl]);

    return { imageUrl, loading };
}

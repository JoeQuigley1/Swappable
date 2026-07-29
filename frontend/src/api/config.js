export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const BACKEND_ORIGIN =
    API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveImageUrl(url) {
    if (!url) return null;

    if (
        url.startsWith('http://') ||
        url.startsWith('https://')
    ) {
        return url;
    }

    return `${BACKEND_ORIGIN}${url}`;
}
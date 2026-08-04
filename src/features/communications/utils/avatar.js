const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

export function getAvatarUrl(url) {
    if (!url) return null;

    if (url.startsWith("http")) {
        return url;
    }

    return `${API_URL}${url}`;
}
export function parseContentDisposition(contentDisposition?: string | null): string | null {
    if (!contentDisposition) return null;

    // Try filename*=UTF-8''... first (RFC 5987)
    const filenameStarMatch = contentDisposition.match(/filename\*\s*=\s*([^;]+)/i);
    if (filenameStarMatch) {
        let v = filenameStarMatch[1].trim();
        // form is: UTF-8''encoded-name
        const parts = v.split("''");
        if (parts.length === 2) {
            try {
                return decodeURIComponent(parts[1]);
            } catch {
                return parts[1];
            }
        }
        return v.replace(/(^"|"$)/g, "");
    }

    const filenameMatch = contentDisposition.match(/filename\s*=\s*("?)([^";\n]*)\1/i);
    if (filenameMatch) {
        return filenameMatch[2];
    }

    return null;
}

export function sanitizeFilename(name: string): string {
    // minimal sanitization: remove path separators and control chars
    return name.replace(/[\x00-\x1F\x7F<>:"/\\|?*\u0000-\u001F]/g, '_').trim() || 'download';
}

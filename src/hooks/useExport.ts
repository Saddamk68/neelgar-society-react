import { useCallback, useRef, useState } from "react";
import { fetchPdf } from "../lib/exportClient";

type ExportResult = {
    blob: Blob;
    filename?: string | null;
    contentType?: string;
};

export function useExport() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [result, setResult] = useState<ExportResult | null>(null);
    const controllerRef = useRef<AbortController | null>(null);

    // simple in-memory cache keyed by url (session only)
    const cacheRef = useRef<Map<string, ExportResult>>(new Map());

    const makeKey = (path: string, query?: Record<string, any>) => {
        const q = query ? JSON.stringify(Object.keys(query).sort().reduce((acc, k) => {
            acc[k] = query[k];
            return acc;
        }, {} as Record<string, any>)) : "";
        return `${path}::${q}`;
    };

    const start = useCallback(async (path: string, opts?: { query?: Record<string, any>, method?: "GET" | "POST", body?: any, useCache?: boolean }) => {
        setError(null);
        setLoading(true);
        setResult(null);

        const key = makeKey(path, opts?.query);
        if (opts?.useCache && cacheRef.current.has(key)) {
            const cached = cacheRef.current.get(key)!;
            setResult(cached);
            setLoading(false);
            return cached;
        }

        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        try {
            const res = await fetchPdf(path, { method: opts?.method, query: opts?.query, body: opts?.body, signal: controller.signal });
            const out = { blob: res.blob, filename: res.filename, contentType: res.contentType };
            setResult(out);
            if (opts?.useCache) cacheRef.current.set(key, out);
            setLoading(false);
            return out;
        } catch (err: any) {
            if (err.name === "AbortError") {
                // suppressed abort
                setLoading(false);
                setError(new Error("Request cancelled"));
                throw err;
            }
            setError(err);
            setLoading(false);
            throw err;
        }
    }, []);

    const cancel = useCallback(() => {
        if (controllerRef.current) {
            controllerRef.current.abort();
            controllerRef.current = null;
            setLoading(false);
        }
    }, []);

    const clearCache = useCallback(() => {
        cacheRef.current.clear();
    }, []);

    return {
        start,
        cancel,
        clearCache,
        loading,
        error,
        result,
    };
}

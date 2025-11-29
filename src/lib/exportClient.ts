import { ENV } from "../config/env"; // adjust if your ENV path differs
import { getAuthToken } from "../services/apiClient";
import { parseContentDisposition, sanitizeFilename } from "./filenameUtils";

type FetchPdfOptions = {
    method?: "GET" | "POST";
    query?: Record<string, string | number | boolean | undefined>;
    body?: any;
    headers?: Record<string, string>;
    signal?: AbortSignal | null;
};

/**
 * fetchPdf
 * - Uses native fetch (recommended for binary responses)
 * - Attaches Bearer token if available via getAuthToken()
 * - Parses Content-Disposition to return suggested filename
 */
export async function fetchPdf(path: string, opts: FetchPdfOptions = {}) {
    const method = opts.method ?? "GET";
    const headers: Record<string, string> = {
        Accept: "application/pdf",
        ...(opts.headers ?? {}),
    };

    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    // build URL (path can be full or relative)
    const base = (ENV.API_BASE_URL ?? "").replace(/\/$/, "");
    let url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;

    // append query params
    if (opts.query) {
        const params = new URLSearchParams();
        Object.entries(opts.query).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            params.append(k, String(v));
        });
        const q = params.toString();
        if (q) url += (url.includes("?") ? "&" : "?") + q;
    }

    const fetchInit: RequestInit = {
        method,
        headers,
        credentials: "same-origin",
        signal: opts.signal ?? undefined,
    };

    if (method === "POST" && opts.body !== undefined) {
        if (opts.body instanceof FormData) {
            // browser will set Content-Type automatically
            delete (fetchInit.headers as any)["Content-Type"];
            fetchInit.body = opts.body;
        } else {
            fetchInit.body = JSON.stringify(opts.body);
            (fetchInit.headers as any)["Content-Type"] = "application/json";
        }
    }

    const resp = await fetch(url, fetchInit);
    if (!resp.ok) {
        // try to parse API error body (JSON) for better messages, else throw generic
        let errMsg = `Failed to fetch PDF: ${resp.status} ${resp.statusText}`;
        try {
            const contentType = resp.headers.get("Content-Type") ?? "";
            if (contentType.includes("application/json")) {
                const json = await resp.json();
                errMsg = json?.message ?? JSON.stringify(json);
            } else {
                const text = await resp.text();
                if (text) errMsg = text;
            }
        } catch {
            // ignore parsing errors
        }
        const err = new Error(errMsg);
        // @ts-ignore
        err.httpStatus = resp.status;
        throw err;
    }

    const contentType = resp.headers.get("Content-Type") ?? "application/pdf";
    const cd = resp.headers.get("Content-Disposition");
    const rawFilename = parseContentDisposition(cd) ?? null;
    const filename = rawFilename ? sanitizeFilename(rawFilename) : null;

    const blob = await resp.blob();
    return { blob, filename, contentType };
}

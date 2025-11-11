import { useNotify } from "@/services/notifications";
import { ErrorType } from "@/constants/errorTypes";

/**
 * Centralized hook for displaying backend errors using notifications.
 * You can call this manually in components, but it will also be wired globally.
 */
export function useApiErrorHandler() {
    const notify = useNotify();

    function handleApiError(err: any) {
        const error = err?.type ? err : err?.error;

        switch (error?.type) {
            case ErrorType.UNAUTHORIZED:
                notify.error("Unauthorized access — please sign in again.");
                break;
            case ErrorType.NETWORK_ERROR:
                notify.error("Cannot reach server. Check your internet connection.");
                break;
            case ErrorType.SERVER_ERROR:
                notify.error("Server error — please try again later.");
                break;
            case ErrorType.CLIENT_ERROR:
                notify.warn(error?.message || "Invalid request. Please check your input.");
                break;
            default:
                notify.error("Unexpected error occurred. Please try again.");
        }
    }

    return { handleApiError };
}

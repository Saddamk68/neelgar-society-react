import { useEffect, useRef, useState } from "react";

type TncConsentModalProps = {
    isOpen: boolean;
    submitting: boolean;
    onCancel: () => void;
    onAccept: () => void;
};

// Bump this date whenever the wording below changes — shown to the applicant for transparency.
// (Backend tracks acceptance independently via app.legal.tnc-version in application.yml.)
const TNC_LAST_UPDATED = "23 July 2026";

export default function TncConsentModal({
    isOpen,
    submitting,
    onCancel,
    onAccept,
}: TncConsentModalProps) {
    const [scrolledToEnd, setScrolledToEnd] = useState(false);
    const [checked, setChecked] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setScrolledToEnd(false);
        setChecked(false);

        let readTimer: ReturnType<typeof setTimeout> | undefined;
        const checkTimer = setTimeout(() => {
            const el = bodyRef.current;
            if (el && el.scrollHeight - el.clientHeight <= 16) {
                // Content already fully visible — nothing to scroll, so the scroll
                // handler below would never fire. Give the user a few seconds to
                // actually read it, then enable the checkbox.
                readTimer = setTimeout(() => setScrolledToEnd(true), 4000);
            }
        }, 150); // small delay to let the modal finish laying out

        return () => {
            clearTimeout(checkTimer);
            if (readTimer) clearTimeout(readTimer);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    function handleScroll() {
        const el = bodyRef.current;
        if (!el) return;
        const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
        if (atEnd) setScrolledToEnd(true);
    }

    const canAccept = scrolledToEnd && checked && !submitting;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 flex flex-col max-h-[85vh]">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">Terms &amp; Conditions</h2>
                    <p className="text-xs text-text-muted mt-1">Last updated: {TNC_LAST_UPDATED}</p>
                </div>

                <div
                    ref={bodyRef}
                    onScroll={handleScroll}
                    className="p-5 overflow-y-auto space-y-4 text-sm text-text-primary"
                >
                    <p>
                        Please read this notice carefully before submitting your membership
                        application to Neelgar Society.
                    </p>

                    <div>
                        <h3 className="font-semibold mb-1">What information we collect</h3>
                        <p>
                            Name, date of birth, gender, marital status, gotra, contact number,
                            email address, village/town/district, and any relationship or family
                            details you provide (e.g. claimed family code, relationship to an
                            existing member).
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-1">Why we collect it</h3>
                        <p>
                            To verify your identity, review your application, build and maintain
                            the society's family records and family tree, and to contact you
                            regarding your application or society matters.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-1">Who can see it</h3>
                        <p>
                            Your application details are visible only to your local
                            President/Secretary (who review applications for your area) and
                            society administrators. We do not sell or share your data with third
                            parties for marketing purposes.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-1">Retention</h3>
                        <p>
                            If approved, your details become part of the permanent society member
                            records. If rejected, application data is retained only as long as
                            needed for record-keeping and dispute resolution.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-1">Your consent</h3>
                        <p>
                            By checking the box below and submitting this application, you consent
                            to the collection and use of your information as described above.
                        </p>
                    </div>

                    <p className="text-xs text-text-muted italic">
                        Scroll to the end to enable acceptance.
                    </p>
                </div>

                <div className="p-4 border-t space-y-3">
                    <label
                        className={[
                            "flex items-start gap-2 text-sm p-2 -m-2 rounded-md transition-colors",
                            scrolledToEnd ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-70",
                        ].join(" ")}
                    >
                        <input
                            type="checkbox"
                            checked={checked}
                            disabled={!scrolledToEnd}
                            onChange={(e) => setChecked(e.target.checked)}
                            className="mt-0.5"
                        />
                        <span>
                            I have read and accept the Terms &amp; Conditions and consent to the
                            collection and use of my data as described above.
                        </span>
                    </label>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={submitting}
                            className="px-4 py-2 rounded-md border text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onAccept}
                            disabled={!canAccept}
                            className="px-5 py-2 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-50"
                        >
                            {submitting ? "Submitting…" : "Accept & Submit"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

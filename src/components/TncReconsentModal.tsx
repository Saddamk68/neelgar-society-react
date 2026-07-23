import { useEffect, useRef, useState } from "react";

type TncReconsentModalProps = {
    isOpen: boolean;
    submitting: boolean;
    onAccept: () => void;
};

// Keep this in sync (roughly) with TncConsentModal.tsx used on the public application form.
const TNC_LAST_UPDATED = "23 July 2026";

export default function TncReconsentModal({ isOpen, submitting, onAccept }: TncReconsentModalProps) {
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
                readTimer = setTimeout(() => setScrolledToEnd(true), 4000);
            }
        }, 150);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 flex flex-col max-h-[85vh]">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">Updated Terms &amp; Conditions</h2>
                    <p className="text-xs text-text-muted mt-1">
                        Our Terms &amp; Conditions have been updated (last updated: {TNC_LAST_UPDATED}).
                        Please review and accept to continue using your account.
                    </p>
                </div>

                <div
                    ref={bodyRef}
                    onScroll={handleScroll}
                    className="p-5 overflow-y-auto space-y-4 text-sm text-text-primary"
                >
                    <div>
                        <h3 className="font-semibold mb-1">What information we collect</h3>
                        <p>
                            Name, date of birth, gender, marital status, gotra, contact number,
                            email address, address details, photo, and family/relationship
                            records associated with your membership.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-1">Why we collect it</h3>
                        <p>
                            To maintain accurate society and family records, verify membership
                            details, and communicate with you regarding society matters.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-1">Who can see it</h3>
                        <p>
                            Your record is visible to authorized reviewers (local
                            President/Secretary) and society administrators only. We do not sell
                            or share your data with third parties for marketing purposes.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-1">Your consent</h3>
                        <p>
                            By checking the box below, you consent to the continued collection
                            and use of your information as described above.
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

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onAccept}
                            disabled={!canAccept}
                            className="px-5 py-2 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-50"
                        >
                            {submitting ? "Saving…" : "Accept & Continue"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

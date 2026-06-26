import { useQuery } from "@tanstack/react-query";
import { SOCIETY } from "../../constants/society";
import { getPublicLeadershipDirectory } from "@/features/local-authority/services/publicLeadershipService";

function officerLabel(officer: { status: string; name?: string }) {
    if (officer.status === "ASSIGNED") return officer.name;
    if (officer.status === "ASSIGNED_PRIVATE") return "Assigned (not publicly listed)";
    return "Not yet assigned";
}

export default function Leadership() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["public-leadership"],
        queryFn: getPublicLeadershipDirectory,
        staleTime: 1000 * 60 * 10,
    });

    return (
        <div className="bg-background text-text-primary">
            <section className="bg-surface border-b">
                <div className="max-w-5xl mx-auto px-6 py-16">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-5">
                        {SOCIETY.name}
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-tight">Village Leadership</h1>
                    <p className="mt-3 text-text-muted max-w-xl">
                        President and Secretary for each village/town under {SOCIETY.name}.
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-5xl mx-auto px-6">
                    {isLoading && <p className="text-text-muted">Loading…</p>}
                    {isError && <p className="text-red-500">Could not load leadership directory.</p>}

                    {data && data.length === 0 && (
                        <p className="text-text-muted">No villages/towns recorded yet.</p>
                    )}

                    {data && data.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2">
                            {data.map((v) => (
                                <div key={v.geoUnitId} className="bg-white rounded-xl shadow p-5">
                                    <div className="text-lg font-semibold">{v.villageName}</div>
                                    {(v.districtName || v.stateName) && (
                                        <div className="text-xs text-text-muted mb-3">
                                            {[v.districtName, v.stateName].filter(Boolean).join(", ")}
                                        </div>
                                    )}
                                    <div className="space-y-1.5 text-sm mt-3">
                                        <div>
                                            <span className="text-text-muted">President: </span>
                                            <span className="font-medium">{officerLabel(v.president)}</span>
                                        </div>
                                        <div>
                                            <span className="text-text-muted">Secretary: </span>
                                            <span className="font-medium">{officerLabel(v.secretary)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

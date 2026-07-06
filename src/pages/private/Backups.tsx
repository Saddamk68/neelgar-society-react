import PageHeader from "@/components/layout/PageHeader";
import BackupPanel from "@/features/backups/components/BackupPanel";

export default function Backups() {
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <PageHeader
                title="Database Backups"
                subtitle="Trigger a manual backup or review recent automatic backups."
            />
            <BackupPanel />
        </div>
    );
}

import { Link } from "react-router-dom";
import { UserPlus, Search } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export default function Membership() {
    return (
        <div className="bg-background text-text-primary min-h-screen">
            <section className="bg-surface border-b">
                <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-5">
                        Membership
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-text-primary">
                        Join Neelgar Society
                    </h1>
                    <p className="mt-5 text-text-muted leading-relaxed max-w-xl mx-auto">
                        Whether you're applying for the first time or checking on an application you already
                        submitted, start here.
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-6">
                    <Link
                        to={ROUTES.PUBLIC.MEMBERSHIP_APPLICATION}
                        className="group bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-start gap-4 hover:border-primary hover:shadow-md transition"
                    >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-text-primary">Submit New Application</h2>
                        <p className="text-sm text-text-muted leading-relaxed">
                            New to the society? Fill out your details to apply for membership. Your local
                            President/Secretary will verify and approve it.
                        </p>
                        <span className="text-sm font-semibold text-primary group-hover:underline">
                            Start application →
                        </span>
                    </Link>

                    <Link
                        to={ROUTES.PUBLIC.APPLICATION_STATUS}
                        className="group bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-start gap-4 hover:border-primary hover:shadow-md transition"
                    >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition">
                            <Search className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-text-primary">Track Existing Application</h2>
                        <p className="text-sm text-text-muted leading-relaxed">
                            Already applied? Enter your reference code to check your application status.
                        </p>
                        <span className="text-sm font-semibold text-primary group-hover:underline">
                            Check status →
                        </span>
                    </Link>
                </div>
            </section>
        </div>
    );
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getMember } from "@/features/members/services/memberService";
import { ROUTES } from "@/constants/routes";

export default function MyFamilyRedirect() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: member, isLoading, isError } = useQuery({
        queryKey: ["member", user?.memberCode],
        queryFn: () => getMember(user!.memberCode!),
        enabled: !!user?.memberCode,
    });

    useEffect(() => {
        if (member?.familyCode) {
            navigate(`${ROUTES.PRIVATE.FAMILIES}/${member.familyCode}/view`, { replace: true });
        }
    }, [member, navigate]);

    if (isError) {
        return <div className="p-4 text-sm text-red-600">Could not load your family details.</div>;
    }
    return <div className="p-4 text-sm text-slate-500">Loading your family…</div>;
}

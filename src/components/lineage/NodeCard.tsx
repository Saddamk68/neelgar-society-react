import { useNavigate } from "react-router-dom";
import MemberAvatar from "../MemberAvatar";
import { Member } from "../../features/members/types";
import { ROUTES } from "../../constants/routes";

export const NODE_W = 160; // px — must match w-40
export const NODE_H = 148; // px — approximate card height
export const SPOUSE_GAP = 56; // px gap between member and spouse card
export const SPOUSE_W = 160; // px — same as main node

type Props = {
    member: Member;
    isFocal?: boolean;
    focalFamilyCode: string;
    style?: React.CSSProperties;
    isSpouse?: boolean;
};

export default function NodeCard({
    member,
    isFocal,
    focalFamilyCode,
    style,
    isSpouse,
}: Props) {
    const navigate = useNavigate();
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
    const isSameFamily = member.familyCode === focalFamilyCode;

    let borderClass = "border-slate-300";
    let bgClass = "bg-white";

    if (isFocal) {
        borderClass = "border-primary";
        bgClass = "bg-primary/10";
    } else if (isSpouse) {
        borderClass = "border-pink-300";
        bgClass = "bg-pink-50";
    } else if (!isSameFamily) {
        borderClass = "border-amber-400";
        bgClass = "bg-amber-50";
    }

    if (!member.isActive) {
        bgClass += " opacity-60";
    }

    return (
        <button
            type="button"
            onClick={() =>
                navigate(`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/view`)
            }
            className={[
                "flex flex-col items-center p-3 rounded-xl border-2 transition",
                "text-center hover:shadow-md hover:scale-[1.02] focus:outline-none",
                "focus:ring-2 focus:ring-primary/40",
                borderClass,
                bgClass,
            ].join(" ")}
            style={{ width: NODE_W, ...style }}
            title={`View ${fullName}`}
        >
            <MemberAvatar
                memberCode={member.memberCode}
                firstName={member.firstName}
                lastName={member.lastName}
                hasPhoto={member.hasPhoto ?? false}
                size="sm"
            />

            <div className="mt-2 text-xs font-semibold text-slate-800 leading-tight line-clamp-2 w-full">
                {fullName}
            </div>

            <div className="text-xs font-mono text-slate-400 mt-0.5 truncate w-full">
                {member.memberCode}
            </div>

            {member.familyCode && (
                <div
                    className={[
                        "text-xs mt-1 px-1.5 py-0.5 rounded font-mono truncate w-full",
                        isSameFamily
                            ? "bg-slate-100 text-slate-500"
                            : isSpouse
                                ? "bg-pink-100 text-pink-700"
                                : "bg-amber-100 text-amber-700",
                    ].join(" ")}
                >
                    {member.familyCode}
                </div>
            )}

            {isSpouse && (
                <div className="text-xs mt-1 text-pink-500 font-medium">Spouse</div>
            )}

            {isFocal && (
                <div className="text-xs mt-1 text-primary font-medium">● You are here</div>
            )}

            {!member.isActive && (
                <div className="text-xs mt-1 text-slate-400 italic">Inactive</div>
            )}
        </button>
    );
}

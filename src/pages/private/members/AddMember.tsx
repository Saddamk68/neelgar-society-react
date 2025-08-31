import {
    useForm,
    useFieldArray,
    SubmitHandler,
    SubmitErrorHandler,
    type Resolver,
} from "react-hook-form";
import { JSX, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    MemberZ,
    MemberFormValues,
    MemberFormSections,
    defaultMemberValues,
} from "../../../features/members/memberForm.schema";
import { LABELS } from "../../../constants/labels";
import { createMember } from "../../../features/members/services/memberService";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import FieldLabel from "../../../components/form/FieldLabel";
import { makeIsRequired } from "../../../utils/required";

export default function AddMember() {
    const navigate = useNavigate();

    const resolver: Resolver<MemberFormValues> = zodResolver(MemberZ);

    const form = useForm<MemberFormValues>({
        resolver,
        defaultValues: defaultMemberValues,
        mode: "onBlur",
    });

    const { setFocus } = form;
    const values = form.watch();

    const childrenArray = useFieldArray({ control: form.control, name: "children" as const });
    const vehiclesArray = useFieldArray({ control: form.control, name: "vehicles" as const });

    // Auto-clear spouse & children when not married (prevents stale hidden data)
    useEffect(() => {
        if (values.maritalStatus !== "married") {
            form.setValue("spouseName", "");
            form.setValue("spousePhone", "");
            form.setValue("spouseEmail", "");
            if (values.maritalStatus === "single") {
                form.setValue("children", []);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.maritalStatus]);

    const onSubmit: SubmitHandler<MemberFormValues> = async (data) => {
        await createMember({
            name: data.name.trim(),
            flatNo: data.flatNo.trim(),
            phone: data.phone?.trim(),
            email: data.email?.trim(),
        });
        navigate(ROUTES.PRIVATE.MEMBERS);
    };

    // 👉 When invalid: focus + smooth-scroll to the first error field
    const onInvalid: SubmitErrorHandler<MemberFormValues> = (errors) => {
        // recursive finder for first error path, e.g., "children.0.name"
        const findFirst = (obj: any, prefix = ""): string | null => {
            for (const key of Object.keys(obj)) {
                const val = obj[key];
                const path = prefix ? `${prefix}.${key}` : key;
                if (val && typeof val.message === "string") return path;
                if (val && typeof val === "object") {
                    const deep = findFirst(val, path);
                    if (deep) return deep;
                }
            }
            return null;
        };
        const firstName = findFirst(errors as any) ?? null;
        if (firstName) {
            // focus the field
            setFocus(firstName as any, { shouldSelect: true });

            // try smooth scroll to the input/select/textarea with matching name
            requestAnimationFrame(() => {
                const el =
                    document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
                        `[name="${cssEscape(firstName)}"]`
                    );
                if (el && typeof el.scrollIntoView === "function") {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });
        }
    };

    // Minimal CSS.escape polyfill for attribute selectors
    function cssEscape(name: string) {
        return name.replace(/"/g, '\\"');
    }

    // // util: detect if field is required based on schema
    // function isRequired(name: string) {
    //     // These match schema rules
    //     const alwaysRequired = ["name", "flatNo", "phone"];
    //     // spouseName required if married, child name required if row exists
    //     if (name === "spouseName" && values.maritalStatus === "married") return true;
    //     if (name.startsWith("children.") && name.endsWith(".name")) return true;
    //     return alwaysRequired.includes(name);
    // }

    // unified field renderer with fixed-height error line (no layout jump) + red ring on error
    const renderField = (fieldName: string, _label: string, type: string, options?: any[]) => {
        const error = form.formState.errors as any;
        const errMsg: string | undefined = error?.[fieldName]?.message;

        const baseInput =
            "w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 transition";
        const normalBorder = "border-slate-300 focus:ring-primary/40";
        const errorBorder = "border-red-400 ring-1 ring-red-400 focus:ring-red-400";

        const className =
            baseInput + " " + (errMsg ? errorBorder : normalBorder);

        const common = {
            className,
            ...form.register(fieldName as any),
            "aria-invalid": !!errMsg,
            "aria-describedby": `${fieldName}-error`,
            placeholder: "",
        };

        let control: JSX.Element | null = null;

        switch (type) {
            case "text":
            case "email":
            case "tel":
            case "date":
                control = <input type={type} {...common} />;
                break;
            case "textarea":
                control = <textarea {...common} rows={4} />;
                break;
            case "checkbox":
                control = (
                    <input
                        type="checkbox"
                        className={`h-4 w-4 rounded border ${errMsg ? "border-red-400 ring-1 ring-red-400" : "border-slate-300"}`}
                        checked={(values as any)[fieldName]}
                        onChange={(e) => form.setValue(fieldName as any, e.target.checked)}
                        aria-invalid={!!errMsg}
                        aria-describedby={`${fieldName}-error`}
                    />
                );
                break;
            case "select":
                control = (
                    <select
                        className={className}
                        value={(values as any)[fieldName] ?? ""}
                        onChange={(e) => form.setValue(fieldName as any, e.target.value)}
                        aria-invalid={!!errMsg}
                        aria-describedby={`${fieldName}-error`}
                    >
                        <option value="">Select</option>
                        {(options ?? []).map((opt: any) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );
                break;
            default:
                control = null;
        }

        return (
            <>
                {control}
                <div id={`${fieldName}-error`} className="h-4 text-xs text-danger mt-1">
                    {errMsg ?? ""}
                </div>
            </>
        );
    };

    // options for selects
    const optionMap: Record<string, any[]> = {
        gender: LABELS.gender,
        maritalStatus: LABELS.maritalStatus,
        ownershipStatus: LABELS.ownershipStatus,
        state: LABELS.statesIndia,
        education: LABELS.educationLevels,
        bloodGroup: LABELS.bloodGroups,
    };

    // Required-field rules for the Add Member form
    const isRequired = makeIsRequired<MemberFormValues>({
        always: ["name", "flatNo", "phone"],
        conditional: [
            (v) => (v.maritalStatus === "married" ? ["spouseName"] : []),
            // any child row present -> child name required (use wildcard)
            (_v) => ["children.*.name"],
        ],
    });

    return (
        <div>
            <h1 className="text-2xl font-semibold mb-1">Add Member</h1>
            <p className="text-text-muted mb-6">
                This form is schema-driven and will be expanded to match your HTML.
            </p>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void form.handleSubmit(onSubmit, onInvalid)(e);
                }}
                className="space-y-6"
            >
                {MemberFormSections
                    .filter((section) => (section.showIf ? section.showIf(values) : true))
                    .map((section) => {
                        const cols =
                            section.gridCols === 1
                                ? "grid-cols-1"
                                : section.gridCols === 3
                                    ? "grid-cols-1 md:grid-cols-3"
                                    : "grid-cols-1 md:grid-cols-2";

                        return (
                            <section key={section.key} className="bg-white rounded-xl shadow p-6">
                                <h2 className="text-lg font-semibold">{section.title}</h2>
                                {section.description && (
                                    <p className="text-sm text-text-muted mb-4">{section.description}</p>
                                )}

                                {/* Regular fields */}
                                <div className={`mt-4 grid gap-4 ${cols}`}>
                                    {section.fields
                                        .filter((f) => f.type !== "group-array")
                                        .filter((f) => (f.showIf ? f.showIf(values) : true))
                                        .map((f) => (
                                            <div key={f.name as string} className="flex flex-col">
                                                {/* <label className="block text-sm mb-1">
                                                    {f.label}
                                                    {isRequired(f.name as string) && (
                                                        <span className="text-red-500 ml-0.5">*</span>
                                                    )}
                                                </label> */}
                                                <FieldLabel required={isRequired(f.name as string, values)}>
                                                    {f.label}
                                                </FieldLabel>
                                                {renderField(
                                                    f.name as string,
                                                    f.label,
                                                    f.type,
                                                    optionMap[f.name as string]
                                                )}
                                            </div>
                                        ))}
                                </div>

                                {/* Children group */}
                                {section.fields.some((f) => f.name === "children" && f.type === "group-array") && (
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium">Children</h3>
                                            <button
                                                type="button"
                                                onClick={() => childrenArray.append({ name: "", dob: "" })}
                                                className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 transition text-sm"
                                            >
                                                + Add Child
                                            </button>
                                        </div>

                                        {childrenArray.fields.length === 0 && (
                                            <p className="text-sm text-text-muted">No children added.</p>
                                        )}

                                        <div className="space-y-3">
                                            {childrenArray.fields.map((field, idx) => {
                                                const nameErr =
                                                    (form.formState.errors.children?.[idx] as any)?.name?.message;

                                                const childInputBase =
                                                    "w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 transition";
                                                const childClass =
                                                    childInputBase +
                                                    " " +
                                                    (nameErr ? "border-red-400 ring-1 ring-red-400 focus:ring-red-400" : "border-slate-300 focus:ring-primary/40");

                                                return (
                                                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                                        <div>
                                                            {/* <label className="block text-sm mb-1">
                                                                Name
                                                                {isRequired(`children.${idx}.name`) && (
                                                                    <span className="text-red-500 ml-0.5">*</span>
                                                                )}
                                                            </label> */}
                                                            <FieldLabel required={isRequired(`children.${idx}.name`, values)}>Name</FieldLabel>
                                                            <input
                                                                className={childClass}
                                                                {...form.register(`children.${idx}.name` as const)}
                                                            />
                                                            <div className="h-4 text-xs text-danger mt-1">
                                                                {nameErr ?? ""}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            {/* <label className="block text-sm mb-1">DOB</label> */}
                                                            <FieldLabel>DOB</FieldLabel>
                                                            <input
                                                                type="date"
                                                                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                                {...form.register(`children.${idx}.dob` as const)}
                                                            />
                                                            <div className="h-4 text-xs mt-1" />
                                                        </div>
                                                        <div className="flex items-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => childrenArray.remove(idx)}
                                                                className="px-3 py-2 rounded-md border border-slate-300 hover:bg-slate-50 transition text-sm"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Vehicles group */}
                                {section.fields.some((f) => f.name === "vehicles" && f.type === "group-array") && (
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium">Vehicles</h3>
                                            <button
                                                type="button"
                                                onClick={() => vehiclesArray.append({ type: "", number: "" })}
                                                className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 transition text-sm"
                                            >
                                                + Add Vehicle
                                            </button>
                                        </div>

                                        {vehiclesArray.fields.length === 0 && (
                                            <p className="text-sm text-text-muted">No vehicles added.</p>
                                        )}

                                        <div className="space-y-3">
                                            {vehiclesArray.fields.map((field, idx) => (
                                                <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                                    <div>
                                                        <label className="block text-sm mb-1">Type</label>
                                                        <input
                                                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                            {...form.register(`vehicles.${idx}.type` as const)}
                                                            placeholder="Car/Bike/Scooter"
                                                        />
                                                        <div className="h-4 text-xs mt-1" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm mb-1">Number</label>
                                                        <input
                                                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                            {...form.register(`vehicles.${idx}.number` as const)}
                                                            placeholder="e.g., MH12AB1234"
                                                        />
                                                        <div className="h-4 text-xs mt-1" />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => vehiclesArray.remove(idx)}
                                                            className="px-3 py-2 rounded-md border border-slate-300 hover:bg-slate-50 transition text-sm"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>
                        );
                    })}

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                        className="px-4 py-2 rounded-md bg-primary text-white shadow-sm hover:shadow transition disabled:opacity-60"
                    >
                        {form.formState.isSubmitting ? "Saving…" : "Save Member"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.PRIVATE.MEMBERS)}
                        className="px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-50 transition"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

import {
  useForm,
  useFieldArray,
  type SubmitHandler,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MemberZ,
  type MemberFormValues,
  MemberFormSections,
  defaultMemberValues,
} from "../../../features/members/memberForm.schema";
import { LABELS } from "../../../constants/labels";
import { createMember } from "../../../features/members/services/memberService";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";

export default function AddMember() {
  const navigate = useNavigate();

  // ✅ Make the resolver explicitly typed to MemberFormValues
  const resolver: Resolver<MemberFormValues> = zodResolver(MemberZ);

  const form = useForm<MemberFormValues>({
    resolver,
    defaultValues: defaultMemberValues,
    mode: "onBlur",
  });

  const values = form.watch();

  const childrenArray = useFieldArray({
    control: form.control,
    name: "children" as const,
  });
  const vehiclesArray = useFieldArray({
    control: form.control,
    name: "vehicles" as const,
  });

  // ✅ Explicit type for the submit handler
  const onSubmit: SubmitHandler<MemberFormValues> = async (data) => {
    await createMember({
      name: data.name.trim(),
      flatNo: data.flatNo.trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim(),
    });
    navigate(ROUTES.PRIVATE.MEMBERS);
  };

  // Helper to render a simple field
  const renderField = (
    fieldName: string,
    _label: string,
    type: string,
    options?: any[]
  ) => {
    const error = form.formState.errors as any;
    const errMsg: string | undefined = error?.[fieldName]?.message;

    const common = {
      className:
        "w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40",
      ...form.register(fieldName as any),
      "aria-invalid": !!errMsg,
      "aria-describedby": errMsg ? `${fieldName}-error` : undefined,
      placeholder: "",
    };

    switch (type) {
      case "text":
      case "email":
      case "tel":
      case "date":
        return (
          <>
            <input type={type} {...common} />
            {errMsg && (
              <p id={`${fieldName}-error`} className="text-danger text-sm mt-1">
                {errMsg}
              </p>
            )}
          </>
        );
      case "textarea":
        return (
          <>
            <textarea {...common} rows={4} />
            {errMsg && (
              <p id={`${fieldName}-error`} className="text-danger text-sm mt-1">
                {errMsg}
              </p>
            )}
          </>
        );
      case "checkbox":
        return (
          <>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={(values as any)[fieldName]}
              onChange={(e) => form.setValue(fieldName as any, e.target.checked)}
            />
            {errMsg && (
              <p id={`${fieldName}-error`} className="text-danger text-sm mt-1">
                {errMsg}
              </p>
            )}
          </>
        );
      case "select":
        return (
          <>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={(values as any)[fieldName] ?? ""}
              onChange={(e) => form.setValue(fieldName as any, e.target.value)}
            >
              <option value="">Select</option>
              {(options ?? []).map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errMsg && (
              <p id={`${fieldName}-error`} className="text-danger text-sm mt-1">
                {errMsg}
              </p>
            )}
          </>
        );
      default:
        return null;
    }
  };

  // Centralized options
  const optionMap: Record<string, any[]> = {
    gender: LABELS.gender,
    maritalStatus: LABELS.maritalStatus,
    ownershipStatus: LABELS.ownershipStatus,
    state: LABELS.statesIndia,
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Add Member</h1>
      <p className="text-text-muted mb-6">
        This form is schema-driven and will be expanded to match your HTML.
      </p>

      {/* ✅ Important: wrap handleSubmit call so TS infers the generic */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-6"
      >
        {MemberFormSections.map((section) => {
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
                <p className="text-sm text-text-muted mb-4">
                  {section.description}
                </p>
              )}

              {/* Regular fields */}
              <div className={`mt-4 grid gap-4 ${cols}`}>
                {section.fields
                  .filter((f) => f.type !== "group-array")
                  .filter((f) => (f.showIf ? f.showIf(values) : true))
                  .map((f) => (
                    <div key={f.name as string} className="flex flex-col">
                      <label className="block text-sm mb-1">{f.label}</label>
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
              {section.fields.some(
                (f) => f.name === "children" && f.type === "group-array"
              ) && (
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
                    {childrenArray.fields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
                      >
                        <div>
                          <label className="block text-sm mb-1">Name</label>
                          <input
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            {...form.register(`children.${idx}.name` as const)}
                          />
                          {form.formState.errors.children?.[idx]?.name && (
                            <p className="text-danger text-sm mt-1">
                              {
                                (form.formState.errors.children[idx] as any)
                                  .name?.message
                              }
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm mb-1">DOB</label>
                          <input
                            type="date"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            {...form.register(`children.${idx}.dob` as const)}
                          />
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
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicles group */}
              {section.fields.some(
                (f) => f.name === "vehicles" && f.type === "group-array"
              ) && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Vehicles</h3>
                    <button
                      type="button"
                      onClick={() =>
                        vehiclesArray.append({ type: "", number: "" })
                      }
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
                      <div
                        key={field.id}
                        className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
                      >
                        <div>
                          <label className="block text-sm mb-1">Type</label>
                          <input
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            {...form.register(`vehicles.${idx}.type` as const)}
                            placeholder="Car/Bike/Scooter"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Number</label>
                          <input
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            {...form.register(`vehicles.${idx}.number` as const)}
                            placeholder="e.g., MH12AB1234"
                          />
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

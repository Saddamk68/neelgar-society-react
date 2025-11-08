import { useEffect, useState } from "react";
import {
  useForm,
  useFieldArray,
  SubmitHandler,
  SubmitErrorHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
import {
  MemberZ,
  MemberFormValues,
  MemberFormSections,
  defaultMemberValues,
} from "../../../features/members/member.schema";
import {
  getMember,
  updateMember,
  uploadFile,
} from "../../../features/members/services/memberService";
import FieldLabel from "../../../components/form/FieldLabel";
import { makeIsRequired } from "../../../utils/required";
import { ROUTES } from "../../../constants/routes";
import { useNotify } from "../../../services/notifications";
import { LABELS } from "../../../constants/labels";
import { getAuthToken } from "../../../services/apiClient";

/* ------------------ 🖼 Uploadable Image Component ------------------ */
function UploadableImage({
  photoId,
  alt,
  onUploadSuccess,
}: {
  photoId?: string | null;
  alt: string;
  onUploadSuccess: (id: string) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
  const token = getAuthToken();

  useEffect(() => {
    if (!photoId) return;
    const controller = new AbortController();

    async function fetchImage() {
      try {
        const res = await fetch(`${baseUrl}/files/${photoId}/view`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        setSrc(URL.createObjectURL(blob));
      } catch {
        setSrc(null);
      }
    }

    fetchImage();
    return () => controller.abort();
  }, [photoId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const res = await uploadFile(file, "system"); // returns { id, ... }
      if (res.id) {
        onUploadSuccess(res.id);
        setSrc(URL.createObjectURL(file)); // preview immediately
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-36 h-36 bg-gray-100 rounded-md overflow-hidden border flex items-center justify-center">
        {loading ? (
          <div className="text-gray-500 text-sm">Uploading...</div>
        ) : src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-400 text-sm">No photo</div>
        )}
      </div>
      <label className="cursor-pointer px-3 py-1.5 rounded-md bg-primary text-white text-xs hover:opacity-90">
        Upload
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
}

/* ------------------ ✏️ Main Edit Form ------------------ */
export default function EditMember() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notify = useNotify();

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(MemberZ),
    defaultValues: defaultMemberValues,
    mode: "onBlur",
  });

  const values = form.watch();
  const childrenArray = useFieldArray({
    control: form.control,
    name: "children" as const,
  });

  // 🔄 Load Member Details
  useEffect(() => {
    if (id) {
      getMember(id)
        .then((m) =>
          form.reset({
            ...m,
            id: m.id ? String(m.id) : undefined,
            contactNumber: m.contactNumber ? String(m.contactNumber) : "",
            email: m.email ?? "",
            children:
              m.children?.map((c: any) => ({
                ...c,
                dob: c.dob ?? "",
              })) ?? [],
          })
        )
        .catch(() => notify.error("Failed to load member details"));
    }
  }, [id]);

  // ✅ Submit
  const onSubmit: SubmitHandler<MemberFormValues> = async (data) => {
    try {
      if (!id) throw new Error("Missing member ID");
      await updateMember(id, data);
      notify.success("Member updated successfully!");
      navigate(ROUTES.PRIVATE.MEMBERS);
    } catch (err: any) {
      notify.error(err.message || "Failed to update member");
    }
  };

  // ❌ Invalid form
  const onInvalid: SubmitErrorHandler<MemberFormValues> = (errors) => {
    const messages = Object.values(errors)
      .map((err: any) => err?.message)
      .filter(Boolean);
    if (messages.length > 0) notify.error(messages.join(", "));
  };

  const isRequired = makeIsRequired<MemberFormValues>({
    always: ["name", "fatherName", "contactNumber"],
    conditional: [(v) =>
      v.maritalStatus === "MARRIED" ? ["spouseName"] : [],
    ],
  });

  const optionMap: Record<string, any[]> = {
    gender: LABELS.gender,
    maritalStatus: LABELS.maritalStatus,
    education: LABELS.educationLevels,
    bloodGroup: LABELS.bloodGroups,
    state: LABELS.statesIndia,
  };

  const renderField = (fieldName: string, type: string, options?: any[]) => {
    const error = form.formState.errors as any;
    const errMsg: string | undefined = error?.[fieldName]?.message;
    const baseInput =
      "w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 transition";
    const normalBorder = "border-slate-300 focus:ring-primary/40";
    const errorBorder = "border-red-400 ring-1 ring-red-400 focus:ring-red-400";
    const className = baseInput + " " + (errMsg ? errorBorder : normalBorder);

    if (type === "select") {
      return (
        <>
          <select
            className={className}
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
          <div className="h-4 text-xs text-danger mt-1">{errMsg ?? ""}</div>
        </>
      );
    }

    if (type === "checkbox") {
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className={`h-4 w-4 rounded ${
              errMsg
                ? "border-red-400 ring-1 ring-red-400"
                : "border-slate-300"
            }`}
            checked={(values as any)[fieldName]}
            onChange={(e) =>
              form.setValue(fieldName as any, e.target.checked)
            }
          />
        </div>
      );
    }

    return (
      <>
        <input
          type={type === "date" ? "date" : type}
          {...form.register(fieldName as any)}
          className={className}
        />
        <div className="h-4 text-xs text-danger mt-1">{errMsg ?? ""}</div>
      </>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Edit Member</h1>
      <p className="text-text-muted mb-6">
        Update the details of this member.
      </p>

      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-6"
      >
        {/* 🖼 Member Photo */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Member Photo</h2>
          <UploadableImage
            photoId={values.photoId}
            alt={`${values.name} photo`}
            onUploadSuccess={(id) => form.setValue("photoId", id)}
          />
        </section>

        {/* Dynamic Sections */}
        {MemberFormSections.filter((section) =>
          section.showIf ? section.showIf(values) : true
        ).map((section) => {
          const cols =
            section.gridCols === 1
              ? "grid-cols-1"
              : section.gridCols === 3
              ? "grid-cols-1 md:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2";

          return (
            <section key={section.key} className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold">{section.title}</h2>

              <div className={`mt-4 grid gap-4 ${cols}`}>
                {section.fields
                  .filter((f) => f.type !== "group-array")
                  .map((f) => (
                    <div key={f.name as string} className="flex flex-col">
                      <FieldLabel required={isRequired(f.name as string, values)}>
                        {f.label}
                      </FieldLabel>
                      {renderField(
                        f.name as string,
                        f.type,
                        optionMap[f.name as string]
                      )}
                    </div>
                  ))}
              </div>

              {/* 👩‍❤️‍👨 Spouse Photo */}
              {section.key === "spouse" && values.maritalStatus === "MARRIED" && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Spouse Photo</h3>
                  <UploadableImage
                    photoId={values.spousePhotoId}
                    alt={`${values.spouseName ?? "Spouse"} photo`}
                    onUploadSuccess={(id) =>
                      form.setValue("spousePhotoId", id)
                    }
                  />
                </div>
              )}

              {/* 👶 Children */}
              {section.fields.some((f) => f.name === "children") && (
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

                  {childrenArray.fields.map((field, idx) => {
                    const nameErr =
                      (form.formState.errors.children?.[idx] as any)?.name
                        ?.message;
                    const dobErr =
                      (form.formState.errors.children?.[idx] as any)?.dob
                        ?.message;

                    return (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start"
                      >
                        {/* Name */}
                        <div>
                          <FieldLabel required>Name</FieldLabel>
                          <input
                            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 transition ${
                              nameErr
                                ? "border-red-400 ring-1 ring-red-400 focus:ring-red-400"
                                : "border-slate-300 focus:ring-primary/40"
                            }`}
                            {...form.register(`children.${idx}.name` as const)}
                          />
                          <div className="min-h-[1rem] text-xs text-danger mt-1">
                            {nameErr ?? ""}
                          </div>
                        </div>

                        {/* DOB */}
                        <div>
                          <FieldLabel>DOB</FieldLabel>
                          <input
                            type="date"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            {...form.register(`children.${idx}.dob` as const)}
                          />
                          <div className="min-h-[1rem] text-xs text-danger mt-1">
                            {dobErr ?? ""}
                          </div>
                        </div>

                        {/* Photo */}
                        <div>
                          <FieldLabel>Photo</FieldLabel>
                          <UploadableImage
                            photoId={field.photoId}
                            alt={`${field.name || "Child"} photo`}
                            onUploadSuccess={(id) =>
                              form.setValue(`children.${idx}.photoId`, id)
                            }
                          />
                        </div>

                        {/* Remove */}
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
              )}
            </section>
          );
        })}

        {/* Role Section */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold">Role</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <FieldLabel>Role</FieldLabel>
              <select
                className="w-full rounded-md border px-3 py-2 bg-gray-100 text-gray-600"
                value={values.role ?? ""}
                disabled
              >
                <option value="MEMBER">MEMBER</option>
              </select>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="px-4 py-2 rounded-md bg-primary text-white shadow-sm hover:shadow transition disabled:opacity-60"
          >
            {form.formState.isSubmitting ? "Saving…" : "Save Changes"}
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

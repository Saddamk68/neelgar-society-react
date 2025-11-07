import {
  useForm,
  useFieldArray,
  SubmitHandler,
  SubmitErrorHandler,
  type Resolver,
} from "react-hook-form";
import { JSX, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MemberZ,
  MemberFormValues,
  MemberFormSections,
  defaultMemberValues,
} from "../../../features/members/member.schema";
import { LABELS } from "../../../constants/labels";
import { createMember, uploadFile } from "../../../features/members/services/memberService";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import FieldLabel from "../../../components/form/FieldLabel";
import { makeIsRequired } from "../../../utils/required";
import { useNotify } from "../../../services/notifications";
import { useAuth } from "../../../context/AuthContext"; // ✅ to get username

// ----------------- FileUploader Subcomponent -----------------
function FileUploader({
  label,
  onUploadComplete,
}: {
  label: string;
  onUploadComplete: (uuid: string | null) => void;
}) {
  const notify = useNotify();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(f.type)) {
      notify.error("Only JPG and PNG images are allowed");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      notify.error("Image must be 5MB or less");
      return;
    }

    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadFile(file, user?.username ?? "system");
      if (res?.id) {
        onUploadComplete(res.id);
        setUploaded(true);
        notify.success("Image uploaded successfully!");
      } else {
        notify.error("Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      notify.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-4 border rounded-lg p-4 bg-slate-50">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && (
        <div className="mt-3 relative inline-block">
          <img
            src={preview}
            alt="preview"
            className="h-24 w-24 object-cover rounded-md border"
          />
          {uploaded && (
            <span className="absolute bottom-1 right-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
              ✓ Uploaded
            </span>
          )}
        </div>
      )}
      {file && !uploaded && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="ml-2 px-3 py-1.5 text-sm rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      )}
    </div>
  );
}

// ----------------- Main AddMember Form -----------------
export default function AddMember() {
  const notify = useNotify();
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

  // track uploaded image UUID
  const [uploadedPhotoId, setUploadedPhotoId] = useState<string | null>(null);

  // Auto-clear spouse & children when not married
  useEffect(() => {
    if (values.maritalStatus !== "MARRIED") {
      form.setValue("spouseName", "");
      form.setValue("spouseDob", "");
      form.setValue("spouseEducation", "");
      form.setValue("spouseOccupation", "");
      form.setValue("spouseGotra", "");
      if (values.maritalStatus === "SINGLE") {
        form.setValue("children", []);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.maritalStatus]);

  // ---------- Submit ----------
  const onSubmit: SubmitHandler<MemberFormValues> = async (data) => {
    try {
      // attach uploaded image uuid if available
      if (uploadedPhotoId) {
        data.photoId = uploadedPhotoId;
      }
      await createMember(data);
      notify.success("Member created successfully!");
      navigate(ROUTES.PRIVATE.MEMBERS);
    } catch (err: any) {
      notify.error(err.message || "Failed to create member");
    }
  };

  // ---------- Handle errors ----------
  const onInvalid: SubmitErrorHandler<MemberFormValues> = (errors) => {
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
      setFocus(firstName as any, { shouldSelect: true });
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          `[name="${cssEscape(firstName)}"]`
        );
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
  };

  function cssEscape(name: string) {
    return name.replace(/"/g, '\\"');
  }

  // util for required marks
  const isRequired = makeIsRequired<MemberFormValues>({
    always: ["name", "fatherName", "gotra", "contactNumber"],
    conditional: [
      (v) => (v.maritalStatus === "MARRIED" ? ["spouseName"] : []),
      (_v) => ["children.*.name"],
    ],
  });

  // options for selects
  const optionMap: Record<string, any[]> = {
    gender: LABELS.gender,
    maritalStatus: LABELS.maritalStatus,
    education: LABELS.educationLevels,
  };

  // unified renderer (unchanged from your version)
  const renderField = (fieldName: string, _label: string, type: string, options?: any[]) => {
    const error = form.formState.errors as any;
    const errMsg: string | undefined = error?.[fieldName]?.message;

    const baseInput = "w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 transition";
    const normalBorder = "border-slate-300 focus:ring-primary/40";
    const errorBorder = "border-red-400 ring-1 ring-red-400 focus:ring-red-400";

    const className = baseInput + " " + (errMsg ? errorBorder : normalBorder);

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
            className={`h-4 w-4 rounded border ${errMsg ? "border-red-400 ring-1 ring-red-400 focus:ring-red-400" : "border-slate-300"}`}
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
                        <FieldLabel required={isRequired(f.name as string, values)}>
                          {f.label}
                        </FieldLabel>
                        {renderField(f.name as string, f.label, f.type, optionMap[f.name as string])}
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
                          (nameErr
                            ? "border-red-400 ring-1 ring-red-400 focus:ring-red-400"
                            : "border-slate-300 focus:ring-primary/40");

                        return (
                          <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div>
                              <FieldLabel required={isRequired(`children.${idx}.name`, values)}>
                                Name
                              </FieldLabel>
                              <input
                                className={childClass}
                                {...form.register(`children.${idx}.name` as const)}
                              />
                              <div className="h-4 text-xs text-danger mt-1">
                                {nameErr ?? ""}
                              </div>
                            </div>
                            <div>
                              <FieldLabel>DOB</FieldLabel>
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
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}

        {/* ✅ Added FileUploader here */}
        <FileUploader
          label="Upload Member Image"
          onUploadComplete={(uuid) => setUploadedPhotoId(uuid)}
        />

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

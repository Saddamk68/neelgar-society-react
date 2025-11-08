import {
  useForm,
  useFieldArray,
  SubmitHandler,
  SubmitErrorHandler,
} from "react-hook-form";
import { JSX, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MemberZ,
  MemberFormValues,
  defaultMemberValues,
} from "../../../features/members/member.schema";
import { LABELS } from "../../../constants/labels";
import { createMember, uploadFile } from "../../../features/members/services/memberService";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import FieldLabel from "../../../components/form/FieldLabel";
import { makeIsRequired } from "../../../utils/required";
import { useNotify } from "../../../services/notifications";
import { useAuth } from "../../../context/AuthContext";

/* ===========================================================
   🧩 Utility: Safe nested getter (for TS + runtime safety)
   =========================================================== */
function getNestedValue(obj: any, path: string): any {
  return path
    .split(".")
    .reduce((acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined), obj);
}

/* ===========================================================
   🖼️ FileUploader Subcomponent
   =========================================================== */
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

/* ===========================================================
   🧾 Main AddMember Form
   =========================================================== */
export default function AddMember() {
  const notify = useNotify();
  const navigate = useNavigate();

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(MemberZ),
    defaultValues: defaultMemberValues,
    mode: "onBlur",
  });

  const { watch, setValue } = form;
  const values = watch();
  const childrenArray = useFieldArray({ control: form.control, name: "children" });

  const [uploadedPhotoId, setUploadedPhotoId] = useState<string | null>(null);

  // ✅ Auto-clear spouse and children when not married
  useEffect(() => {
    if (values.maritalStatus !== "MARRIED") {
      setValue("spouse", undefined);
      if (values.maritalStatus === "SINGLE") {
        setValue("children", []);
      }
    }
  }, [values.maritalStatus, setValue]);

  /* ===========================================================
     🚀 Submit Handler
     =========================================================== */
  const onSubmit: SubmitHandler<MemberFormValues> = async (data) => {
    try {
      if (uploadedPhotoId) {
        data.photoId = uploadedPhotoId;
      }
      await createMember(data);
      notify.success("Member created successfully!");
      navigate(ROUTES.PRIVATE.MEMBERS);
    } catch (err: any) {
      console.error(err);
      notify.error(err.message || "Failed to create member");
    }
  };

  const onInvalid: SubmitErrorHandler<MemberFormValues> = (errors) => {
    console.error(errors);
    notify.error("Please fix form errors before submitting.");
  };

  const isRequired = makeIsRequired<MemberFormValues>({
    always: ["name", "fatherName", "gotra", "contactNumber"],
    conditional: [(v) => (v.maritalStatus === "MARRIED" ? ["spouse.name"] : [])],
  });

  const optionMap: Record<string, any[]> = {
    gender: LABELS.gender,
    maritalStatus: LABELS.maritalStatus,
    education: LABELS.educationLevels,
  };

  /* ===========================================================
     🧱 Field Renderer (with safe TS nested value getter)
     =========================================================== */
  const renderField = (fieldName: string, label: string, type: string, options?: any[]) => {
    const error = form.formState.errors as any;
    const errMsg: string | undefined = getNestedValue(error, fieldName)?.message;
    const value = getNestedValue(values, fieldName);

    const baseInput =
      "w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 transition";
    const normalBorder = "border-slate-300 focus:ring-primary/40";
    const errorBorder = "border-red-400 ring-1 ring-red-400 focus:ring-red-400";
    const className = baseInput + " " + (errMsg ? errorBorder : normalBorder);

    switch (type) {
      case "select":
        return (
          <>
            <select
              className={className}
              value={value ?? ""}
              onChange={(e) => setValue(fieldName as any, e.target.value)}
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
      case "checkbox":
        return (
          <input
            type="checkbox"
            className="h-4 w-4 border-slate-300 rounded"
            checked={!!value}
            onChange={(e) => setValue(fieldName as any, e.target.checked)}
          />
        );
      default:
        return (
          <>
            <input
              type={type}
              {...form.register(fieldName as any)}
              className={className}
            />
            <div className="h-4 text-xs text-danger mt-1">{errMsg ?? ""}</div>
          </>
        );
    }
  };

  /* ===========================================================
     🧩 UI Rendering
     =========================================================== */
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Add Member</h1>
      <p className="text-text-muted mb-6">
        Create a new member with nested data structure.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        {/* ===== Basic Info ===== */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "name", label: "Full Name", type: "text" },
              { name: "dob", label: "Date of Birth", type: "date" },
              { name: "gender", label: "Gender", type: "select", options: optionMap.gender },
              { name: "maritalStatus", label: "Marital Status", type: "select", options: optionMap.maritalStatus },
              { name: "fatherName", label: "Father's Name", type: "text" },
              { name: "motherName", label: "Mother's Name", type: "text" },
              { name: "motherGotra", label: "Mother's Gotra", type: "text" },
              { name: "occupation", label: "Occupation", type: "text" },
              { name: "education", label: "Education", type: "text" },
              { name: "gotra", label: "Gotra", type: "text" },
            ].map((f) => (
              <div key={f.name}>
                <FieldLabel required={isRequired(f.name, values)}>{f.label}</FieldLabel>
                {renderField(f.name, f.label, f.type, f.options)}
              </div>
            ))}
          </div>
        </section>

        {/* ===== Address ===== */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "address.currentVillage",
              "address.currentTahsil",
              "address.currentDistrict",
              "address.currentState",
              "address.paternalVillage",
              "address.paternalTahsil",
              "address.paternalDistrict",
              "address.paternalState",
            ].map((f) => (
              <div key={f}>
                <FieldLabel>{f.split(".")[1]}</FieldLabel>
                {renderField(f, f, "text")}
              </div>
            ))}
          </div>
        </section>

        {/* ===== Spouse ===== */}
        {values.maritalStatus === "MARRIED" && (
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Spouse</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "spouse.name",
                "spouse.dob",
                "spouse.gotra",
                "spouse.education",
                "spouse.occupation",
              ].map((f) => (
                <div key={f}>
                  <FieldLabel required={isRequired(f, values)}>{f.split(".")[1]}</FieldLabel>
                  {renderField(f, f, f.includes("dob") ? "date" : "text")}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== Children ===== */}
        {values.maritalStatus !== "SINGLE" && (
          <section className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Children</h2>
              <button
                type="button"
                onClick={() => childrenArray.append({ name: "", dob: "" })}
                className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 transition text-sm"
              >
                + Add Child
              </button>
            </div>
            <div className="space-y-3">
              {childrenArray.fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <FieldLabel>Name</FieldLabel>
                    <input
                      {...form.register(`children.${idx}.name` as const)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <FieldLabel>DOB</FieldLabel>
                    <input
                      type="date"
                      {...form.register(`children.${idx}.dob` as const)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
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
          </section>
        )}

        {/* ===== File Upload ===== */}
        <FileUploader
          label="Upload Member Image"
          onUploadComplete={(uuid) => setUploadedPhotoId(uuid)}
        />

        {/* ===== Actions ===== */}
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

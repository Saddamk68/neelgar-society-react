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
import { useAuth } from "../../../context/AuthContext";
import { ENV } from "@/config/env";

/* ===========================================================
   🧩 Utility: Safe Nested Getter
   =========================================================== */
function getNestedValue(obj: any, path: string): any {
  return path
    .split(".")
    .reduce((acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined), obj);
}

/* ===========================================================
   🖼 UploadableImage Component
   =========================================================== */
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
  const baseUrl = ENV.API_BASE_URL ?? "";
  const token = getAuthToken();
  const { user } = useAuth();
  const notify = useNotify(); // ✅ Notification hook

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
  }, [photoId, baseUrl, token]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Step 1: Validate file size (max 5 MB)
    const MAX_SIZE_MB = ENV.MAX_UPLOAD_MB;
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > MAX_SIZE_MB) {
      notify.error(`File size must be less than ${MAX_SIZE_MB} MB.`);
      e.target.value = ""; // reset file input
      return;
    }

    // ✅ Step 2: Proceed with upload
    try {
      setLoading(true);
      const res = await uploadFile(file, user?.username ?? "system");
      if (res.id) {
        onUploadSuccess(res.id);
        setSrc(URL.createObjectURL(file)); // immediate preview
        notify.success("File uploaded successfully.");
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
      notify.error("File upload failed. Please try again.");
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

/* ===========================================================
   ✏️ Edit Member (Schema-Aligned)
   =========================================================== */
export default function EditMember() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notify = useNotify();

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(MemberZ),
    defaultValues: defaultMemberValues,
    mode: "onBlur",
  });

  const { setValue, watch, reset } = form;
  const values = watch();
  const childrenArray = useFieldArray({ control: form.control, name: "children" });

  // 🔄 Load Member Details
  useEffect(() => {
    if (!id) return;
    getMember(id)
      .then((m) => reset(m))
      .catch(() => notify.error("Failed to load member details"));
  }, [id]);

  // ✅ Submit
  const onSubmit: SubmitHandler<MemberFormValues> = async (data) => {
    try {
      if (!id) throw new Error("Missing member ID");
      await updateMember(id, data);
      notify.success("Member updated successfully!");
      navigate(ROUTES.PRIVATE.MEMBERS);
    } catch (err: any) {
      console.error(err);
      notify.error(err.message || "Failed to update member");
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
     🧱 Field Renderer
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
     🧩 UI
     =========================================================== */
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Edit Member</h1>
      <p className="text-text-muted mb-6">Update existing member information.</p>

      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        {/* Photo */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Member Photo</h2>
          <UploadableImage
            photoId={values.photoId}
            alt={`${values.name} photo`}
            onUploadSuccess={(id) => setValue("photoId", id)}
          />
        </section>

        {/* Basic Info */}
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

        {/* Address */}
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

        {/* Spouse */}
        {values.maritalStatus === "MARRIED" && (
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Spouse</h2>
            <UploadableImage
              photoId={values.spouse?.photoId}
              alt="Spouse photo"
              onUploadSuccess={(id) => setValue("spouse.photoId", id)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

        {/* Children */}
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
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
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
                    <FieldLabel>Photo</FieldLabel>
                    <UploadableImage
                      photoId={field.photoId as any}
                      alt="Child photo"
                      onUploadSuccess={(id) => setValue(`children.${idx}.photoId`, id)}
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
          </section>
        )}

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

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMember } from "../../../features/members/services/memberService";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  flatNo: z.string().min(1, "Flat number is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function AddMember() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    await createMember({
      name: values.name.trim(),
      flatNo: values.flatNo.trim(),
      phone: values.phone?.trim() || undefined,
      email: values.email?.trim() || undefined,
    });
    navigate(ROUTES.PRIVATE.MEMBERS);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-1">Add Member</h1>
      <p className="text-text-muted mb-6">Fill in the details below.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-xl shadow p-6">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            {...register("name")}
            placeholder="e.g., Asha Patel"
          />
          {errors.name && <p className="text-danger text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm mb-1">Flat No.</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            {...register("flatNo")}
            placeholder="e.g., A-101"
          />
          {errors.flatNo && <p className="text-danger text-sm mt-1">{errors.flatNo.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Phone</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              {...register("phone")}
              placeholder="e.g., 9876543210"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              {...register("email")}
              placeholder="e.g., name@example.com"
            />
            {errors.email && <p className="text-danger text-sm mt-1">{errors.email.message}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-primary text-white shadow-sm hover:shadow transition disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save Member"}
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

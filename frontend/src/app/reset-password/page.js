"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "../../components/PageShell";
import ResetPasswordForm from "../../components/forms/ResetPasswordForm";
import { apiRequest } from "../../lib/apiClient";
import { getAuth, updateAuth } from "../../lib/authStore";

const emptyReset = { newPassword: "", confirmPassword: "" };

export default function ResetPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyReset);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.resetToken) {
      router.push("/forgot-password");
    }
  }, [router]);

  async function handleReset() {
    const auth = getAuth();
    setStatus({ type: "loading", message: "Resetting password..." });
    const result = await apiRequest({
      path: "/api/auth/reset-password",
      body: form,
      headers: { "x-reset-token": auth.resetToken },
    });
    if (!result.ok) {
      setStatus({
        type: "error",
        message: result.data?.error || "Password reset failed.",
      });
      return;
    }
    updateAuth({ resetToken: "" });
    setStatus({
      type: "success",
      message: "Password reset. Redirecting to login.",
    });
    router.push("/login");
  }

  return (
    <PageShell
      title="Reset password"
      subtitle="Set a new password for your account."
    >
      <ResetPasswordForm
        form={form}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
        }
        onSubmit={handleReset}
      />
      {status && (
        <section className="card">
          <h2>Status</h2>
          <p className={status.type === "error" ? "error" : ""}>
            {status.message}
          </p>
        </section>
      )}
    </PageShell>
  );
}

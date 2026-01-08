"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "../../components/PageShell";
import ForgotPasswordForm from "../../components/forms/ForgotPasswordForm";
import { apiRequest } from "../../lib/apiClient";

const emptyForgot = { email: "" };

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForgot);
  const [status, setStatus] = useState(null);

  async function handleSendOtp() {
    setStatus({ type: "loading", message: "Sending reset OTP..." });
    const result = await apiRequest({
      path: "/api/auth/forgot-password",
      body: form,
    });
    if (!result.ok) {
      setStatus({
        type: "error",
        message: result.data?.error || "Failed to send reset OTP.",
      });
      return;
    }
    setStatus({
      type: "success",
      message: "Reset OTP sent. Redirecting.",
    });
    router.push(`/verify-reset-otp?email=${encodeURIComponent(form.email)}`);
  }

  return (
    <PageShell
      title="Forgot password"
      subtitle="Send a reset OTP to your email."
    >
      <ForgotPasswordForm
        form={form}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
        }
        onSubmit={handleSendOtp}
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

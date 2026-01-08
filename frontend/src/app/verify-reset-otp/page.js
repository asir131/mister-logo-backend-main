"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "../../components/PageShell";
import OtpForm from "../../components/forms/OtpForm";
import { apiRequest } from "../../lib/apiClient";
import { updateAuth } from "../../lib/authStore";

const emptyOtp = { email: "", otp: "" };

export default function VerifyResetOtpPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState(emptyOtp);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const email = params.get("email");
    if (email) {
      setForm((prev) => ({ ...prev, email }));
    }
  }, [params]);

  async function handleVerify() {
    setStatus({ type: "loading", message: "Verifying reset OTP..." });
    const result = await apiRequest({
      path: "/api/auth/verify-reset-otp",
      body: form,
    });
    if (!result.ok) {
      setStatus({
        type: "error",
        message: result.data?.error || "Reset OTP verification failed.",
      });
      return;
    }
    updateAuth({ resetToken: result.data.resetToken });
    setStatus({
      type: "success",
      message: "OTP verified. Redirecting to reset password.",
    });
    router.push("/reset-password");
  }

  return (
    <PageShell
      title="Verify reset OTP"
      subtitle="Confirm the OTP to reset your password."
    >
      <OtpForm
        title="Verify reset OTP"
        description="Enter the OTP sent for password reset."
        form={form}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
        }
        onSubmit={handleVerify}
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

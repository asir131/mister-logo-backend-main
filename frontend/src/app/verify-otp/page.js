"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "../../components/PageShell";
import OtpForm from "../../components/forms/OtpForm";
import { apiRequest } from "../../lib/apiClient";

const emptyOtp = { email: "", otp: "" };

export default function VerifyOtpPage() {
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
    setStatus({ type: "loading", message: "Verifying OTP..." });
    const result = await apiRequest({
      path: "/api/auth/verify-otp",
      body: form,
    });
    if (!result.ok) {
      setStatus({
        type: "error",
        message: result.data?.error || "OTP verification failed.",
      });
      return;
    }
    setStatus({
      type: "success",
      message: "OTP verified. Redirecting to login.",
    });
    router.push("/login?verified=1");
  }

  return (
    <PageShell
      title="Verify OTP"
      subtitle="Enter the OTP sent to your email."
    >
      <OtpForm
        title="Verify registration OTP"
        description="Complete registration with your email OTP."
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

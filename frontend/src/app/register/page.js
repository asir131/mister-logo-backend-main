"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "../../components/PageShell";
import RegisterForm from "../../components/forms/RegisterForm";
import { apiRequest } from "../../lib/apiClient";

const emptyRegister = {
  name: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyRegister);
  const [status, setStatus] = useState(null);

  async function handleRegister() {
    setStatus({ type: "loading", message: "Sending OTP..." });
    const result = await apiRequest({
      path: "/api/auth/register",
      body: form,
    });
    if (!result.ok) {
      setStatus({
        type: "error",
        message: result.data?.error || "Registration failed.",
      });
      return;
    }
    setStatus({
      type: "success",
      message: "OTP sent. Redirecting to verification.",
    });
    router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
  }

  return (
    <PageShell
      title="Register"
      subtitle="Create your account and verify the OTP."
    >
      <RegisterForm
        form={form}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
        }
        onSubmit={handleRegister}
        onLogin={() => router.push("/login")}
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "../../components/PageShell";
import CompleteProfileForm from "../../components/forms/CompleteProfileForm";
import { apiRequest } from "../../lib/apiClient";
import { getAuth, setProfile, setProfileCompleted } from "../../lib/authStore";

const emptyProfile = {
  username: "",
  role: "",
  displayName: "",
  bio: "",
  instagramUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  facebookUrl: "",
  spotifyArtistUrl: "",
};

export default function CompleteProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyProfile);
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.token) {
      router.push("/login");
    }
  }, [router]);

  async function handleComplete() {
    const auth = getAuth();
    if (!auth.token) {
      router.push("/login");
      return;
    }
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    if (imageFile) formData.append("profileImage", imageFile);
    setStatus({ type: "loading", message: "Creating profile..." });
    const result = await apiRequest({
      path: "/api/profile/complete",
      body: formData,
      token: auth.token,
    });
    if (!result.ok) {
      setStatus({
        type: "error",
        message: result.data?.error || "Profile completion failed.",
      });
      return;
    }
    setProfile(result.data.profile);
    setProfileCompleted(true);
    setStatus({ type: "success", message: "Profile completed. Redirecting." });
    router.push("/feed");
  }

  return (
    <PageShell
      title="Complete profile"
      subtitle="Finish onboarding before accessing the feed."
    >
      <CompleteProfileForm
        form={form}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
        }
        onFileChange={(event) => setImageFile(event.target.files?.[0] || null)}
        onSubmit={handleComplete}
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

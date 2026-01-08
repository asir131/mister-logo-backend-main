"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "../../components/PageShell";
import UpdateProfileForm from "../../components/forms/UpdateProfileForm";
import UserProfileHeader from "../../components/profile/UserProfileHeader";
import UserPostSection from "../../components/profile/UserPostSection";
import { apiRequest } from "../../lib/apiClient";
import { clearAuth, getAuth, setProfile } from "../../lib/authStore";

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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfileState] = useState(null);
  const [form, setForm] = useState(emptyProfile);
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [overview, setOverview] = useState(null);
  const [sections, setSections] = useState({
    image: { items: [], page: 1, totalPages: 1, loading: false },
    video: { items: [], page: 1, totalPages: 1, loading: false },
    audio: { items: [], page: 1, totalPages: 1, loading: false },
  });

  useEffect(() => {
    const auth = getAuth();
    if (!auth.token) {
      router.push("/login");
      return;
    }
    setUser(auth.user);
    loadProfile(auth.token);
  }, [router]);

  async function loadProfile(token) {
    const result = await apiRequest({
      path: "/api/profile/me",
      method: "GET",
      token,
    });
    if (result.ok) {
      setProfile(result.data.profile);
      setProfileState(result.data.profile);
      setForm({ ...emptyProfile, ...result.data.profile });
      const profileData = result.data.profile || {};
      setOverview({
        user: user || {},
        profile: profileData,
        stats: {
          postsCount: profileData.postsCount || 0,
          followersCount: profileData.followersCount || 0,
          followingCount: profileData.followingCount || 0,
        },
        mediaCounts: {
          image: profileData.imageCount || 0,
          video: profileData.videoCount || 0,
          audio: profileData.audioCount || 0,
        },
        viewerIsFollowing: false,
      });
      const mapPost = (entry, mediaType) => ({
        _id: entry.postId,
        mediaType,
        mediaUrl: entry.mediaUrl,
        description: entry.description,
        createdAt: entry.createdAt,
        likeCount: 0,
        commentCount: 0,
      });
      setSections({
        image: {
          items: (profileData.imagePosts || []).map((entry) =>
            mapPost(entry, "image"),
          ),
          page: 1,
          totalPages: 1,
          loading: false,
        },
        video: {
          items: (profileData.videoPosts || []).map((entry) =>
            mapPost(entry, "video"),
          ),
          page: 1,
          totalPages: 1,
          loading: false,
        },
        audio: {
          items: (profileData.audioPosts || []).map((entry) =>
            mapPost(entry, "audio"),
          ),
          page: 1,
          totalPages: 1,
          loading: false,
        },
      });
      return;
    }
    if (result.status === 404) {
      router.push("/complete-profile");
    }
  }

  async function handleUpdate() {
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
    setStatus({ type: "loading", message: "Updating profile..." });
    const result = await apiRequest({
      path: "/api/profile/me",
      method: "PATCH",
      body: formData,
      token: auth.token,
    });
    if (!result.ok) {
      setStatus({
        type: "error",
        message: result.data?.error || "Profile update failed.",
      });
      return;
    }
    setProfile(result.data.profile);
    setProfileState(result.data.profile);
    setStatus({ type: "success", message: "Profile updated." });
  }

  return (
    <PageShell
      title="Profile"
      subtitle="Review account info and update profile details."
      actions={
        <>
          <Link className="btn ghost" href="/feed">
            Back to feed
          </Link>
          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              clearAuth();
              router.push("/login");
            }}
          >
            Logout
          </button>
        </>
      }
    >
      {overview && (
        <UserProfileHeader
          user={user}
          profile={overview.profile}
          stats={overview.stats}
          mediaCounts={overview.mediaCounts}
          viewerIsFollowing={overview.viewerIsFollowing}
          onToggleFollow={() => {}}
          isSelf
        />
      )}
      <UserPostSection
        title="Image posts"
        posts={sections.image.items}
        loading={sections.image.loading}
        canLoadMore={false}
        onLoadMore={() => {}}
      />
      <UserPostSection
        title="Video posts"
        posts={sections.video.items}
        loading={sections.video.loading}
        canLoadMore={false}
        onLoadMore={() => {}}
      />
      <UserPostSection
        title="Audio posts"
        posts={sections.audio.items}
        loading={sections.audio.loading}
        canLoadMore={false}
        onLoadMore={() => {}}
      />
      <UpdateProfileForm
        form={form}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
        }
        onFileChange={(event) => setImageFile(event.target.files?.[0] || null)}
        onSubmit={handleUpdate}
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

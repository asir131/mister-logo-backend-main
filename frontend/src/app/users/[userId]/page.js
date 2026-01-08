"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageShell from "../../../components/PageShell";
import UserProfileHeader from "../../../components/profile/UserProfileHeader";
import UserPostSection from "../../../components/profile/UserPostSection";
import { apiRequest } from "../../../lib/apiClient";
import { getAuth } from "../../../lib/authStore";

const emptySection = { items: [], page: 1, totalPages: 1, loading: false };

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { userId } = params;
  const auth = getAuth();
  const [overview, setOverview] = useState(null);
  const [status, setStatus] = useState(null);
  const [sections, setSections] = useState({
    image: { ...emptySection },
    video: { ...emptySection },
    audio: { ...emptySection },
  });

  useEffect(() => {
    if (!auth.token) {
      router.push("/login");
      return;
    }
    loadOverview();
  }, [userId]);

  async function loadOverview() {
    setStatus({ type: "loading", message: "Loading profile..." });
    const result = await apiRequest({
      path: `/api/users/${userId}/overview`,
      method: "GET",
      token: auth.token,
    });
    if (!result.ok) {
      setStatus({
        type: "error",
        message: result.data?.error || "Failed to load profile.",
      });
      return;
    }
    setOverview(result.data);
    setStatus(null);
    loadPosts("image", 1, true);
    loadPosts("video", 1, true);
    loadPosts("audio", 1, true);
  }

  async function loadPosts(mediaType, page, replace) {
    setSections((prev) => ({
      ...prev,
      [mediaType]: { ...prev[mediaType], loading: true },
    }));
    const result = await apiRequest({
      path: `/api/users/${userId}/posts?mediaType=${mediaType}&page=${page}&limit=6`,
      method: "GET",
      token: auth.token,
    });
    if (!result.ok) {
      setSections((prev) => ({
        ...prev,
        [mediaType]: { ...prev[mediaType], loading: false },
      }));
      return;
    }
    setSections((prev) => {
      const existing = replace ? [] : prev[mediaType].items;
      return {
        ...prev,
        [mediaType]: {
          items: [...existing, ...result.data.posts],
          page: result.data.page,
          totalPages: result.data.totalPages,
          loading: false,
        },
      };
    });
  }

  async function handleToggleFollow() {
    if (!overview?.user?.id) return;
    const isFollowing = overview.viewerIsFollowing;
    const result = await apiRequest({
      path: isFollowing
        ? `/api/follows/${overview.user.id}`
        : "/api/follows",
      method: isFollowing ? "DELETE" : "POST",
      body: isFollowing ? null : { userId: overview.user.id },
      token: auth.token,
    });
    if (!result.ok) return;
    setOverview((prev) => ({
      ...prev,
      viewerIsFollowing: !isFollowing,
      stats: {
        ...prev.stats,
        followersCount: prev.stats.followersCount + (isFollowing ? -1 : 1),
      },
    }));
  }

  const isSelf = auth.user?.id === overview?.user?.id || auth.user?._id === overview?.user?.id;

  return (
    <PageShell
      title="User profile"
      subtitle="Explore posts and profile statistics."
    >
      {overview && (
        <UserProfileHeader
          user={overview.user}
          profile={overview.profile}
          stats={overview.stats}
          mediaCounts={overview.mediaCounts}
          viewerIsFollowing={overview.viewerIsFollowing}
          onToggleFollow={handleToggleFollow}
          isSelf={isSelf}
        />
      )}
      {status && (
        <section className="card">
          <h2>Status</h2>
          <p className={status.type === "error" ? "error" : ""}>
            {status.message}
          </p>
        </section>
      )}
      <UserPostSection
        title="Image posts"
        posts={sections.image.items}
        loading={sections.image.loading}
        canLoadMore={sections.image.page < sections.image.totalPages}
        onLoadMore={() => loadPosts("image", sections.image.page + 1)}
      />
      <UserPostSection
        title="Video posts"
        posts={sections.video.items}
        loading={sections.video.loading}
        canLoadMore={sections.video.page < sections.video.totalPages}
        onLoadMore={() => loadPosts("video", sections.video.page + 1)}
      />
      <UserPostSection
        title="Audio posts"
        posts={sections.audio.items}
        loading={sections.audio.loading}
        canLoadMore={sections.audio.page < sections.audio.totalPages}
        onLoadMore={() => loadPosts("audio", sections.audio.page + 1)}
      />
    </PageShell>
  );
}

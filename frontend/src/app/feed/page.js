"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "../../components/PageShell";
import CreatePostForm from "../../components/forms/CreatePostForm";
import PostCard from "../../components/feed/PostCard";
import { apiRequest } from "../../lib/apiClient";
import { clearAuth, getAuth, getProfile } from "../../lib/authStore";

const emptyPost = {
  description: "",
  shareToFacebook: false,
  shareToInstagram: false,
};

export default function FeedPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyPost);
  const [mediaFile, setMediaFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [posts, setPosts] = useState([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedTotalPages, setFeedTotalPages] = useState(1);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const auth = getAuth();

  useEffect(() => {
    if (!auth.token) {
      router.push("/login");
      return;
    }
    const profileState = getProfile();
    if (!profileState.completed) {
      router.push("/complete-profile");
      return;
    }

    loadFeed(1, true);
  }, [router]);

  async function loadFeed(page, replace) {
    setFeedLoading(true);
    setFeedError(null);
    const result = await apiRequest({
      path: `/api/feed?page=${page}&limit=5`,
      method: "GET",
      token: auth.token,
    });
    if (!result.ok) {
      setFeedError(result.data?.error || "Failed to load feed.");
      setFeedLoading(false);
      return;
    }
    setFeedPage(result.data.page);
    setFeedTotalPages(result.data.totalPages);
    setPosts((prev) => (replace ? result.data.posts : [...prev, ...result.data.posts]));
    setFeedLoading(false);
  }

  async function handleCreatePost() {
    if (!auth.token) {
      router.push("/login");
      return;
    }
    const formData = new FormData();
    if (form.description) formData.append("description", form.description);
    formData.append("shareToFacebook", form.shareToFacebook);
    formData.append("shareToInstagram", form.shareToInstagram);
    if (mediaFile) formData.append("media", mediaFile);
    setStatus({ type: "loading", message: "Creating post..." });
    const result = await apiRequest({
      path: "/api/posts",
      body: formData,
      token: auth.token,
    });
    if (!result.ok) {
      setStatus({
        type: "error",
        message: result.data?.error || "Post creation failed.",
      });
      return;
    }
    setStatus({ type: "success", message: "Post created successfully." });
    setForm(emptyPost);
    setMediaFile(null);
    loadFeed(1, true);
  }

  async function handleToggleLike(post) {
    if (!auth.token) return;
    const liked = post.viewerHasLiked;
    const result = await apiRequest({
      path: liked ? `/api/likes/${post._id}` : "/api/likes",
      method: liked ? "DELETE" : "POST",
      body: liked ? null : { postId: post._id },
      token: auth.token,
    });
    if (!result.ok) return;
    setPosts((prev) =>
      prev.map((item) => {
        if (item._id !== post._id) return item;
        const nextLiked = !liked;
        return {
          ...item,
          viewerHasLiked: nextLiked,
          likeCount: item.likeCount + (nextLiked ? 1 : -1),
        };
      }),
    );
  }

  async function handleToggleFollow(post) {
    if (!auth.token || !post.author?.id) return;
    const isFollowing = post.viewerIsFollowing;
    const result = await apiRequest({
      path: isFollowing ? `/api/follows/${post.author.id}` : "/api/follows",
      method: isFollowing ? "DELETE" : "POST",
      body: isFollowing ? null : { userId: post.author.id },
      token: auth.token,
    });
    if (!result.ok) return;
    setPosts((prev) =>
      prev.map((item) => {
        if (item.author?.id !== post.author.id) return item;
        return { ...item, viewerIsFollowing: !isFollowing };
      }),
    );
  }

  async function handleLoadComments(post, page = 1) {
    if (!auth.token) return;
    setCommentsByPost((prev) => ({
      ...prev,
      [post._id]: {
        ...(prev[post._id] || { items: [], page: 0, totalPages: 1 }),
        loading: true,
      },
    }));
    const result = await apiRequest({
      path: `/api/comments?postId=${post._id}&page=${page}&limit=3`,
      method: "GET",
      token: auth.token,
    });
    if (!result.ok) {
      setCommentsByPost((prev) => ({
        ...prev,
        [post._id]: { ...(prev[post._id] || {}), loading: false },
      }));
      return;
    }
    setCommentsByPost((prev) => {
      const existing = prev[post._id]?.items || [];
      const items =
        page === 1 ? result.data.comments : [...existing, ...result.data.comments];
      return {
        ...prev,
        [post._id]: {
          items,
          page: result.data.page,
          totalPages: result.data.totalPages,
          loading: false,
        },
      };
    });
  }

  async function handleAddComment(post, text) {
    if (!auth.token) return;
    const result = await apiRequest({
      path: "/api/comments",
      body: { postId: post._id, text },
      token: auth.token,
    });
    if (!result.ok) return;
    setPosts((prev) =>
      prev.map((item) =>
        item._id === post._id
          ? { ...item, commentCount: item.commentCount + 1 }
          : item,
      ),
    );
    handleLoadComments(post, 1);
  }

  return (
    <PageShell
      title="Feed"
      subtitle="Create posts and navigate to your profile."
      actions={
        <>
          <Link className="btn ghost" href="/profile">
            Go to profile
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
      <CreatePostForm
        form={form}
        onChange={(event) => {
          const { name, type, checked, value } = event.target;
          setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
          }));
        }}
        onFileChange={(event) => setMediaFile(event.target.files?.[0] || null)}
        onSubmit={handleCreatePost}
      />
      {feedError && (
        <section className="card">
          <h2>Feed error</h2>
          <p className="error">{feedError}</p>
        </section>
      )}
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          currentUserId={auth.user?.id || auth.user?._id}
          onToggleFollow={handleToggleFollow}
          onToggleLike={handleToggleLike}
          commentsState={commentsByPost[post._id]}
          onLoadComments={handleLoadComments}
          onAddComment={handleAddComment}
        />
      ))}
      {feedLoading && (
        <section className="card">
          <h2>Loading feed</h2>
          <p>Fetching more posts...</p>
        </section>
      )}
      {feedPage < feedTotalPages && !feedLoading && (
        <section className="card">
          <button className="btn" type="button" onClick={() => loadFeed(feedPage + 1)}>
            Load more posts
          </button>
        </section>
      )}
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

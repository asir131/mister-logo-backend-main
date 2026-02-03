"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ApiConfigBar from "./ApiConfigBar";
import { apiRequest } from "../lib/apiClient";
import { getAuth } from "../lib/authStore";

export default function PageShell({ title, subtitle, actions, children }) {
  const [connected, setConnected] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.token) return;
    apiRequest({
      path: "/api/accounts",
      method: "GET",
      token: auth.token,
    }).then((result) => {
      if (result.ok) {
        const platforms = Array.isArray(result.data?.accounts)
          ? result.data.accounts
          : [];
        const normalized = platforms
          .map((item) => (item.platform || item.type || item.name || item))
          .map((value) => String(value).toLowerCase());
        setConnected(normalized);
      }
    });
  }, []);

  async function handleConnectLate(platform) {
    const auth = getAuth();
    if (!auth.token) {
      return;
    }
    const result = await apiRequest({
      path: "/api/accounts/connect-late",
      method: "POST",
      token: auth.token,
      body: { platform },
    });
    const redirectUrl = result.data?.url || result.data?.authUrl;
    if (result.ok && redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      // eslint-disable-next-line no-alert
      alert(result.data?.error || "Failed to start LATE connection.");
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <div className="pill">Mister Logo Frontend</div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          {actions && <div className="actions">{actions}</div>}
          <div className="actions">
            <Link className="btn ghost" href="/trending">
              Trending
            </Link>
            <button className="btn ghost" type="button" onClick={() => handleConnectLate("instagram")}>
              Connect Instagram {connected.includes("instagram") ? "✓" : ""}
            </button>
            <button className="btn ghost" type="button" onClick={() => handleConnectLate("facebook")}>
              Connect Facebook {connected.includes("facebook") ? "✓" : ""}
            </button>
            <button className="btn ghost" type="button" onClick={() => handleConnectLate("twitter")}>
              Connect Twitter {connected.includes("twitter") ? "✓" : ""}
            </button>
            <button className="btn ghost" type="button" onClick={() => handleConnectLate("tiktok")}>
              Connect TikTok {connected.includes("tiktok") ? "✓" : ""}
            </button>
            <button className="btn ghost" type="button" onClick={() => handleConnectLate("youtube")}>
              Connect YouTube {connected.includes("youtube") ? "✓" : ""}
            </button>
            <button className="btn ghost" type="button" onClick={() => handleConnectLate("snapchat")}>
              Connect Snapchat {connected.includes("snapchat") ? "✓" : ""}
            </button>
            <Link className="btn ghost" href="/login">
              Login
            </Link>
            <Link className="btn ghost" href="/register">
              Register
            </Link>
          <Link className="btn ghost" href="/feed">
            Feed
          </Link>
          <Link className="btn ghost" href="/ucuts">
            UCuts
          </Link>
          <Link className="btn ghost" href="/uclips">
            UClips
          </Link>
          <Link className="btn ghost" href="/ublast">
            UBlast
          </Link>
          <Link className="btn ghost" href="/my-posts">
            My Posts
          </Link>
          <Link className="btn ghost" href="/saved">
            Saved
          </Link>
          <Link className="btn ghost" href="/scheduled">
            Scheduled
          </Link>
          <Link className="btn ghost" href="/chat">
            Chat
          </Link>
          <Link className="btn ghost" href="/profile">
            Profile
          </Link>
          </div>
        </div>
        <ApiConfigBar />
      </header>
      <main className="grid">{children}</main>
    </div>
  );
}

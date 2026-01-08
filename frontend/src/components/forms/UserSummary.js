export default function UserSummary({ user, profile }) {
  return (
    <section className="card">
      <h2>Current user</h2>
      <p>Snapshot from the latest auth response.</p>
      <div className="row">
        <div>
          <label className="label">Name</label>
          <div className="value">{user?.name || "-"}</div>
        </div>
        <div>
          <label className="label">Email</label>
          <div className="value">{user?.email || "-"}</div>
        </div>
        <div>
          <label className="label">Phone</label>
          <div className="value">{user?.phoneNumber || "-"}</div>
        </div>
      </div>
      <div className="row">
        <div>
          <label className="label">Auth provider</label>
          <div className="value">{user?.authProvider || "local"}</div>
        </div>
        <div>
          <label className="label">User ID</label>
          <div className="value">{user?.id || user?._id || "-"}</div>
        </div>
      </div>
      <div className="divider" />
      <h3>Profile data</h3>
      <div className="row">
        <div>
          <label className="label">Username</label>
          <div className="value">{profile?.username || "-"}</div>
        </div>
        <div>
          <label className="label">Role</label>
          <div className="value">{profile?.role || "-"}</div>
        </div>
        <div>
          <label className="label">Display name</label>
          <div className="value">{profile?.displayName || "-"}</div>
        </div>
      </div>
    </section>
  );
}

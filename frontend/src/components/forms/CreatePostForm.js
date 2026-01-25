const PLATFORMS = [
  { key: "twitter", label: "Twitter/X", auto: true },
  { key: "tiktok", label: "TikTok", auto: true },
  { key: "snapchat", label: "Snapchat", auto: true },
  { key: "youtube", label: "YouTube", auto: true },
  { key: "instagram", label: "Instagram", auto: true },
  { key: "facebook", label: "Facebook", auto: true },
];

export default function CreatePostForm({
  form,
  onChange,
  onToggleTarget,
  onFileChange,
  onSubmit,
}) {
  return (
    <section className="card">
      <h2>Create post</h2>
      <p>Upload media and select where to share.</p>
      <textarea
        name="description"
        value={form.description}
        onChange={onChange}
        placeholder="Post description"
      />
      <div className="row">
        {PLATFORMS.map((platform) => (
          <label className="toggle" key={platform.key}>
            <input
              type="checkbox"
              checked={form.shareTargets?.includes(platform.key)}
              onChange={() => onToggleTarget(platform.key)}
            />
            {platform.label}
          </label>
        ))}
      </div>
      <label className="toggle">
        <input
          type="datetime-local"
          name="scheduledFor"
          value={form.scheduledFor}
          onChange={onChange}
        />
        Schedule time (optional)
      </label>
      <input type="file" accept="image/*,video/*,audio/*" onChange={onFileChange} />
      <div className="actions">
        <button className="btn" type="button" onClick={onSubmit}>
          Create post
        </button>
      </div>
    </section>
  );
}

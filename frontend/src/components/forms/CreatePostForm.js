export default function CreatePostForm({
  form,
  onChange,
  onFileChange,
  onSubmit,
}) {
  return (
    <section className="card">
      <h2>Create post</h2>
      <p>Upload media and optionally queue social shares.</p>
      <textarea
        name="description"
        value={form.description}
        onChange={onChange}
        placeholder="Post description"
      />
      <div className="row">
        <label className="toggle">
          <input
            type="checkbox"
            name="shareToFacebook"
            checked={form.shareToFacebook}
            onChange={onChange}
          />
          Share to Facebook
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            name="shareToInstagram"
            checked={form.shareToInstagram}
            onChange={onChange}
          />
          Share to Instagram
        </label>
      </div>
      <input type="file" accept="image/*,video/*,audio/*" onChange={onFileChange} />
      <div className="actions">
        <button className="btn" type="button" onClick={onSubmit}>
          Create post
        </button>
      </div>
    </section>
  );
}

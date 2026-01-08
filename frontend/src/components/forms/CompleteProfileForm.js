export default function CompleteProfileForm({
  form,
  onChange,
  onFileChange,
  onSubmit,
}) {
  return (
    <section className="card">
      <h2>Complete profile</h2>
      <p>Create profile with avatar and socials.</p>
      <div className="row">
        <input
          name="username"
          value={form.username}
          onChange={onChange}
          placeholder="Username"
        />
        <input
          name="displayName"
          value={form.displayName}
          onChange={onChange}
          placeholder="Display name"
        />
        <input
          name="role"
          value={form.role}
          onChange={onChange}
          placeholder="Role"
        />
      </div>
      <textarea name="bio" value={form.bio} onChange={onChange} placeholder="Bio" />
      <div className="row">
        <input
          name="instagramUrl"
          value={form.instagramUrl}
          onChange={onChange}
          placeholder="Instagram URL"
        />
        <input
          name="tiktokUrl"
          value={form.tiktokUrl}
          onChange={onChange}
          placeholder="TikTok URL"
        />
      </div>
      <div className="row">
        <input
          name="youtubeUrl"
          value={form.youtubeUrl}
          onChange={onChange}
          placeholder="YouTube URL"
        />
        <input
          name="facebookUrl"
          value={form.facebookUrl}
          onChange={onChange}
          placeholder="Facebook URL"
        />
        <input
          name="spotifyArtistUrl"
          value={form.spotifyArtistUrl}
          onChange={onChange}
          placeholder="Spotify URL"
        />
      </div>
      <input type="file" accept="image/*" onChange={onFileChange} />
      <div className="actions">
        <button className="btn" type="button" onClick={onSubmit}>
          Complete profile
        </button>
      </div>
    </section>
  );
}

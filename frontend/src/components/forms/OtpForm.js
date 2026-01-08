export default function OtpForm({ title, description, form, onChange, onSubmit }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="row">
        <input
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder="Email"
        />
        <input
          name="otp"
          value={form.otp}
          onChange={onChange}
          placeholder="OTP"
        />
      </div>
      <div className="actions">
        <button className="btn" type="button" onClick={onSubmit}>
          Verify
        </button>
      </div>
    </section>
  );
}

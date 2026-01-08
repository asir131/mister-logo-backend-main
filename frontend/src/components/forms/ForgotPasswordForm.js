export default function ForgotPasswordForm({ form, onChange, onSubmit }) {
  return (
    <section className="card">
      <h2>Forgot password</h2>
      <p>Send reset OTP to email.</p>
      <div className="row">
        <input
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder="Email"
        />
      </div>
      <div className="actions">
        <button className="btn" type="button" onClick={onSubmit}>
          Send reset OTP
        </button>
      </div>
    </section>
  );
}

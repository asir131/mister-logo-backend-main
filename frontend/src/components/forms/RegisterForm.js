export default function RegisterForm({
  form,
  onChange,
  onSubmit,
  onLogin,
}) {
  return (
    <section className="card">
      <h2>Register</h2>
      <p>Start registration and send OTP to email.</p>
      <div className="row">
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Full name"
        />
        <input
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder="Email"
        />
      </div>
      <div className="row">
        <input
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={onChange}
          placeholder="Phone number"
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder="Password"
        />
        <input
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={onChange}
          placeholder="Confirm password"
        />
      </div>
      <div className="actions">
        <button className="btn" type="button" onClick={onSubmit}>
          Send OTP
        </button>
        <button className="btn ghost" type="button" onClick={onLogin}>
          Go to login
        </button>
      </div>
    </section>
  );
}

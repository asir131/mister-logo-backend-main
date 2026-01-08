export default function LoginForm({
  form,
  onChange,
  onSubmit,
  onForgot,
  onRegister,
}) {
  return (
    <section className="card">
      <h2>Login</h2>
      <p>Login with email or phone.</p>
      <div className="row">
        <input
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder="Email (optional)"
        />
        <input
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={onChange}
          placeholder="Phone number (optional)"
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder="Password"
        />
      </div>
      <div className="actions">
        <button className="btn" type="button" onClick={onSubmit}>
          Login
        </button>
        <button className="btn ghost" type="button" onClick={onRegister}>
          Go to register
        </button>
        <button className="btn secondary" type="button" onClick={onForgot}>
          Forgot password
        </button>
      </div>
    </section>
  );
}

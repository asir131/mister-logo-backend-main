export default function ResetPasswordForm({ form, onChange, onSubmit }) {
  return (
    <section className="card">
      <h2>Reset password</h2>
      <p>Use the reset token from the previous step.</p>
      <div className="row">
        <input
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={onChange}
          placeholder="New password"
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
          Reset password
        </button>
      </div>
    </section>
  );
}

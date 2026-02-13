export default function AuthView({ refs, onLogin, onRegister }) {
  return (
    <section className="panel">
      <h2>Welcome back</h2>
      <div className="stacked">
        <div className="card">
          <h3>Login</h3>
          <label>Email</label>
          <input ref={refs.loginEmailRef} type="email" placeholder="demo@library.local" />
          <label>Password</label>
          <input ref={refs.loginPasswordRef} type="password" placeholder="demo123" />
          <div className="actions">
            <button className="primary" type="button" onClick={onLogin}>
              Sign in
            </button>
          </div>
        </div>
        <div className="card">
          <h3>Create account</h3>
          <label>Name</label>
          <input ref={refs.registerNameRef} type="text" placeholder="Your name" />
          <label>Email</label>
          <input ref={refs.registerEmailRef} type="email" placeholder="you@example.com" />
          <label>Password</label>
          <input ref={refs.registerPasswordRef} type="password" placeholder="Choose a password" />
          <div className="actions">
            <button className="secondary" type="button" onClick={onRegister}>
              Register
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

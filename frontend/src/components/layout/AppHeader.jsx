export default function AppHeader({ status, user, onLogout, onSignIn }) {
  return (
    <header>
      <div className="brand">
        <img src="/logo.svg" alt="Riubs library" className="logo" />
        <div>
          <div className="brand-title">Riubs Library</div>
          <div className="brand-subtitle">Curated rentals, personal shelves</div>
        </div>
      </div>
      <div className="header-actions">
        <div className="status">{status}</div>
        <button className="primary" type="button" onClick={user ? onLogout : onSignIn}>
          {user ? "Sign out" : "Sign in"}
        </button>
      </div>
    </header>
  );
}

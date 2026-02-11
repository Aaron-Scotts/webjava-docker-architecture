import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import ChartCanvas from "./components/ChartCanvas.jsx";

const AUTH_TOKEN_KEY = "riubs_auth_token";

const emptyUser = {
  id: null,
  name: "",
  email: "",
  role: "user",
  budget: 0,
};

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function parseBooksPayload(text) {
  const payload = JSON.parse(text);
  const books = Array.isArray(payload) ? payload : payload.books;
  if (!Array.isArray(books)) {
    throw new Error("invalid_json");
  }
  return books;
}

export default function App() {
  const [status, setStatus] = useState("Not signed in");
  const [view, setView] = useState("auth");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [customBooks, setCustomBooks] = useState([]);
  const [currentRentals, setCurrentRentals] = useState([]);
  const [historyRentals, setHistoryRentals] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminBooks, setAdminBooks] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [budgetEdits, setBudgetEdits] = useState({});
  const [stockEdits, setStockEdits] = useState({});

  const loginEmailRef = useRef(null);
  const loginPasswordRef = useRef(null);
  const registerNameRef = useRef(null);
  const registerEmailRef = useRef(null);
  const registerPasswordRef = useRef(null);
  const addBookTitleRef = useRef(null);
  const addBookAuthorRef = useRef(null);
  const addBookCategoryRef = useRef(null);
  const addBookPriceRef = useRef(null);
  const addBookStockRef = useRef(null);
  const addBookCoverRef = useRef(null);
  const adminBooksFileRef = useRef(null);
  const customBooksFileRef = useRef(null);

  const showToast = useCallback((title, message, variant = "success") => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const apiFetch = useCallback(
    async (path, options = {}) => {
      const headers = { ...(options.headers || {}) };
      const authToken = token || localStorage.getItem(AUTH_TOKEN_KEY);
      if (authToken && !headers.Authorization && !headers.authorization) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await fetch(path, {
        ...options,
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "request_failed");
      }
      return res.json();
    },
    [token]
  );

  const loadBooks = useCallback(async () => {
    const data = await apiFetch("/api/books");
    setBooks(data);
  }, [apiFetch]);

  const loadFavorites = useCallback(async () => {
    if (!user) {
      return;
    }
    const data = await apiFetch("/api/favorites");
    setFavorites(data);
  }, [apiFetch, user]);

  const loadCustomBooks = useCallback(async () => {
    if (!user) {
      return;
    }
    const data = await apiFetch("/api/custom-books");
    setCustomBooks(data);
  }, [apiFetch, user]);

  const loadRentals = useCallback(async () => {
    if (!user) {
      return;
    }
    const currentData = await apiFetch("/api/rentals/current");
    const historyData = await apiFetch("/api/rentals/history");
    setCurrentRentals(currentData);
    setHistoryRentals(historyData);
  }, [apiFetch, user]);

  const loadUserStats = useCallback(async () => {
    if (!user) {
      return;
    }
    const data = await apiFetch("/api/stats/user");
    setUserStats(data);
  }, [apiFetch, user]);

  const loadAdminData = useCallback(async () => {
    if (!user || user.role !== "admin") {
      return;
    }
    const [stats, usersData, booksData] = await Promise.all([
      apiFetch("/api/admin/stats"),
      apiFetch("/api/admin/users"),
      apiFetch("/api/admin/books"),
    ]);
    setAdminStats(stats);
    setAdminUsers(usersData);
    setAdminBooks(booksData);
  }, [apiFetch, user]);

  const loadProfile = useCallback(async () => {
    if (!user) {
      return;
    }
    try {
      const data = await apiFetch("/auth/validate");
      setUser(data.user);
      setStatus(`Signed in as ${data.user.name} (${data.user.role})`);
    } catch (err) {
      console.warn("Profile refresh failed", err);
    }
  }, [apiFetch, user]);

  const refreshAll = useCallback(async () => {
    const results = await Promise.allSettled([
      loadProfile(),
      loadBooks(),
      loadFavorites(),
      loadCustomBooks(),
      loadRentals(),
      loadUserStats(),
      loadAdminData(),
    ]);
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      console.warn("Some data failed to load.", failed);
    }
  }, [
    loadProfile,
    loadBooks,
    loadFavorites,
    loadCustomBooks,
    loadRentals,
    loadUserStats,
    loadAdminData,
  ]);

  const loadSession = useCallback(async () => {
    try {
      const stored = localStorage.getItem(AUTH_TOKEN_KEY);
      if (stored && !token) {
        setToken(stored);
      }
      const data = await apiFetch("/auth/validate");
      setUser(data.user);
      setStatus(`Signed in as ${data.user.name} (${data.user.role})`);
      setView("dashboard");
      await refreshAll();
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setStatus("Not signed in");
      setView("auth");
    }
  }, [apiFetch, refreshAll, token]);

  useEffect(() => {
    loadBooks();
    loadSession();
  }, []);

  const adminVisible = user && user.role === "admin";

  const reloadView = useCallback(
    (nextView) => {
      if (nextView === "dashboard") {
        refreshAll();
      }
      if (nextView === "library") {
        loadBooks();
      }
      if (nextView === "favorites") {
        loadFavorites();
        loadCustomBooks();
      }
      if (nextView === "rentals") {
        loadRentals();
      }
      if (nextView === "analytics") {
        loadUserStats();
      }
      if (nextView === "admin" && adminVisible) {
        loadAdminData();
      }
    },
    [
      adminVisible,
      refreshAll,
      loadBooks,
      loadFavorites,
      loadCustomBooks,
      loadRentals,
      loadUserStats,
      loadAdminData,
    ]
  );

  const handleNav = (nextView) => {
    if (nextView === "favorites" && !user) {
      setView("auth");
      showToast("Sign in", "Please sign in to view favorites.", "error");
      return;
    }
    setView(nextView);
    reloadView(nextView);
  };

  useEffect(() => {
    reloadView(view);
  }, [reloadView, view]);

  const handleLogin = async () => {
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmailRef.current?.value || "",
          password: loginPasswordRef.current?.value || "",
        }),
      });
      setToken(data.token);
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setUser(data.user);
      setStatus(`Signed in as ${data.user.name} (${data.user.role})`);
      setView("dashboard");
      await refreshAll();
    } catch (err) {
      showToast("Login failed", err.message, "error");
    }
  };

  const handleRegister = async () => {
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerNameRef.current?.value || "",
          email: registerEmailRef.current?.value || "",
          password: registerPasswordRef.current?.value || "",
        }),
      });
      showToast("Account created", "You can log in now.");
    } catch (err) {
      showToast("Register failed", err.message, "error");
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn(err);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setStatus("Not signed in");
    setView("auth");
  };

  const addFavorite = async (payload) => {
    try {
      await apiFetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await loadFavorites();
    } catch (err) {
      showToast("Favorite failed", err.message, "error");
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      await apiFetch(`/api/favorites/${favoriteId}`, { method: "DELETE" });
      await loadFavorites();
    } catch (err) {
      showToast("Remove failed", err.message, "error");
    }
  };

  const rentBook = async (bookId) => {
    try {
      const result = await apiFetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      if (user) {
        setUser({ ...user, budget: result.budget });
      }
      await refreshAll();
      const match = books.find((book) => book.id === bookId);
      showToast(
        "Rental confirmed",
        `You rented ${match?.title || "this book"}.`,
        "rent"
      );
    } catch (err) {
      showToast("Rental failed", err.message, "error");
    }
  };

  const returnRental = async (rentalId) => {
    try {
      await apiFetch(`/api/rentals/${rentalId}/return`, { method: "POST" });
      await loadRentals();
      await loadBooks();
      showToast("Rental closed", "You returned a rental.", "return");
    } catch (err) {
      showToast("Return failed", err.message, "error");
    }
  };

  const handleAddBook = async () => {
    try {
      await apiFetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addBookTitleRef.current?.value || "",
          author: addBookAuthorRef.current?.value || "",
          category: addBookCategoryRef.current?.value || "",
          price: Number(addBookPriceRef.current?.value || 0),
          stock: addBookStockRef.current?.value || undefined,
          coverUrl: addBookCoverRef.current?.value || null,
        }),
      });
      await loadBooks();
      await loadAdminData();
      showToast("Book added", "New book added to the library.");
    } catch (err) {
      showToast("Add failed", err.message, "error");
    }
  };

  const handleImportBooks = async () => {
    try {
      const file = adminBooksFileRef.current?.files?.[0];
      if (!file) {
        throw new Error("missing_file");
      }
      const text = await file.text();
      const booksPayload = parseBooksPayload(text);
      await apiFetch("/api/books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ books: booksPayload }),
      });
      await loadBooks();
      await loadAdminData();
      showToast("Import complete", "Books imported to library.");
    } catch (err) {
      showToast("Import failed", err.message, "error");
    }
  };

  const handleUploadCustom = async () => {
    try {
      const file = customBooksFileRef.current?.files?.[0];
      if (!file) {
        throw new Error("missing_file");
      }
      const text = await file.text();
      const booksPayload = parseBooksPayload(text);
      await apiFetch("/api/custom-books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ books: booksPayload }),
      });
      await loadCustomBooks();
      showToast("Custom books added", "Books added to your shelf.");
    } catch (err) {
      showToast("Upload failed", err.message, "error");
    }
  };

  const updateBudget = async (userId) => {
    try {
      const budget = Number(budgetEdits[userId]);
      await apiFetch(`/api/admin/users/${userId}/budget`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget }),
      });
      await loadAdminData();
      showToast("Budget updated", "User budget updated.");
    } catch (err) {
      showToast("Update failed", err.message, "error");
    }
  };

  const updateStock = async (bookId) => {
    try {
      const stock = Number(stockEdits[bookId]);
      await apiFetch(`/api/admin/books/${bookId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
      await loadBooks();
      await loadAdminData();
      showToast("Stock updated", "Book stock updated.");
    } catch (err) {
      showToast("Update failed", err.message, "error");
    }
  };

  const defaultColDef = useMemo(
    () => ({ sortable: true, resizable: true, flex: 1 }),
    []
  );

  const libraryColumnDefs = useMemo(
    () => [
      { field: "title", headerName: "Title", minWidth: 180 },
      { field: "author", headerName: "Author", minWidth: 160 },
      { field: "category", headerName: "Category", minWidth: 140 },
      { field: "stock", headerName: "Stock", maxWidth: 110 },
      {
        field: "price",
        headerName: "Price",
        valueFormatter: (params) => money(params.value),
        maxWidth: 130,
      },
      {
        headerName: "Actions",
        minWidth: 200,
        cellRenderer: (params) => {
          if (!params.data) {
            return null;
          }
          return (
            <div className="actions">
              <button
                className="primary"
                type="button"
                onClick={() => rentBook(params.data.id)}
              >
                Rent
              </button>
              <button
                className="secondary"
                type="button"
                onClick={() => addFavorite({ bookId: params.data.id })}
              >
                Favorite
              </button>
            </div>
          );
        },
      },
    ],
    [addFavorite, rentBook]
  );

  const favoritesColumnDefs = useMemo(
    () => [
      { field: "title", headerName: "Title", minWidth: 180 },
      { field: "author", headerName: "Author", minWidth: 160 },
      { field: "category", headerName: "Category", minWidth: 140 },
      { field: "source", headerName: "Source", maxWidth: 130 },
      {
        field: "price",
        headerName: "Price",
        valueFormatter: (params) => money(params.value),
        maxWidth: 130,
      },
      {
        headerName: "Actions",
        minWidth: 170,
        cellRenderer: (params) => {
          if (!params.data) {
            return null;
          }
          return (
            <button
              className="secondary"
              type="button"
              onClick={() => removeFavorite(params.data.favorite_id || params.data.id)}
            >
              Remove
            </button>
          );
        },
      },
    ],
    [removeFavorite]
  );

  const userTrendChart = useMemo(() => {
    if (!userStats) {
      return null;
    }
    return {
      data: {
        labels: userStats.rentalTrend.map((row) => row.month),
        datasets: [
          {
            label: "Rentals",
            data: userStats.rentalTrend.map((row) => row.count),
            borderColor: "#ff6b35",
            backgroundColor: "rgba(255, 107, 53, 0.2)",
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    };
  }, [userStats]);

  const userCategoryChart = useMemo(() => {
    if (!userStats) {
      return null;
    }
    return {
      data: {
        labels: userStats.categoryBreakdown.map((row) => row.category),
        datasets: [
          {
            label: "Rentals",
            data: userStats.categoryBreakdown.map((row) => row.count),
            backgroundColor: "rgba(17, 24, 39, 0.6)",
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    };
  }, [userStats]);

  const adminCharts = useMemo(() => {
    if (!adminStats) {
      return [];
    }
    return [
      {
        key: "users",
        label: "Users",
        color: "#111827",
        data: adminStats.usersByMonth,
      },
      {
        key: "books",
        label: "Books",
        color: "#ff6b35",
        data: adminStats.booksByMonth,
      },
      {
        key: "rentals",
        label: "Rentals",
        color: "#556b2f",
        data: adminStats.rentalsByMonth,
      },
    ].map((chart) => ({
      ...chart,
      chartData: {
        labels: chart.data.map((row) => row.month),
        datasets: [
          {
            label: chart.label,
            data: chart.data.map((row) => row.count),
            borderColor: chart.color,
            backgroundColor: "rgba(0,0,0,0.05)",
            tension: 0.35,
          },
        ],
      },
    }));
  }, [adminStats]);

  return (
    <div>
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
          <button className="primary" type="button" onClick={user ? handleLogout : () => setView("auth")}
          >
            {user ? "Sign out" : "Sign in"}
          </button>
        </div>
      </header>

      <div className="toast-host" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.variant}`}>
            <div className="toast-title">{toast.title}</div>
            <div className="toast-message">{toast.message}</div>
          </div>
        ))}
      </div>

      <div className="shell">
        <nav>
          <h3>Navigate</h3>
          {[
            { key: "dashboard", label: "Home" },
            { key: "library", label: "Library" },
            { key: "favorites", label: "Favorites" },
            { key: "rentals", label: "Rentals" },
            { key: "analytics", label: "Analytics" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={view === item.key ? "active" : ""}
              onClick={() => handleNav(item.key)}
            >
              {item.label}
            </button>
          ))}
          {adminVisible && (
            <button
              type="button"
              className={view === "admin" ? "active" : ""}
              onClick={() => handleNav("admin")}
            >
              Admin Studio
            </button>
          )}
        </nav>

        <main>
          {view === "auth" && (
            <section className="panel">
              <h2>Welcome back</h2>
              <div className="stacked">
                <div className="card">
                  <h3>Login</h3>
                  <label>Email</label>
                  <input ref={loginEmailRef} type="email" placeholder="demo@library.local" />
                  <label>Password</label>
                  <input ref={loginPasswordRef} type="password" placeholder="demo123" />
                  <div className="actions">
                    <button className="primary" type="button" onClick={handleLogin}>Sign in</button>
                  </div>
                </div>
                <div className="card">
                  <h3>Create account</h3>
                  <label>Name</label>
                  <input ref={registerNameRef} type="text" placeholder="Your name" />
                  <label>Email</label>
                  <input ref={registerEmailRef} type="email" placeholder="you@example.com" />
                  <label>Password</label>
                  <input ref={registerPasswordRef} type="password" placeholder="Choose a password" />
                  <div className="actions">
                    <button className="secondary" type="button" onClick={handleRegister}>Register</button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === "dashboard" && (
            <section className="panel">
              <h2>Personal dashboard</h2>
              <div className="grid cards">
                {[
                  { label: "Budget", value: money(user?.budget || 0) },
                  { label: "Current rentals", value: currentRentals.length },
                  { label: "History", value: historyRentals.length },
                  { label: "Books in library", value: books.length },
                ].map((item) => (
                  <div key={item.label} className="card">
                    <strong>{item.label}</strong>
                    <div className="card-metric">{item.value}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {view === "library" && (
            <section className="panel">
              <h2>Library collection</h2>
              <div className="card grid-frame ag-theme-alpine">
                <AgGridReact
                  rowData={books}
                  columnDefs={libraryColumnDefs}
                  defaultColDef={defaultColDef}
                  rowHeight={52}
                  getRowId={(params) => String(params.data.id)}
                />
              </div>
            </section>
          )}

          {view === "favorites" && (
            <section className="panel">
              <h2>Your favorites</h2>
              <div className="split">
                <div className="card">
                  <h3>Favorites list</h3>
                  <div className="grid-frame ag-theme-alpine">
                    <AgGridReact
                      rowData={favorites}
                      columnDefs={favoritesColumnDefs}
                      defaultColDef={defaultColDef}
                      rowHeight={52}
                      getRowId={(params) =>
                        String(params.data.favorite_id || params.data.id)
                      }
                    />
                  </div>
                </div>
                <div className="card">
                  <h3>Upload custom books (JSON)</h3>
                  <input ref={customBooksFileRef} type="file" accept="application/json" />
                  <button className="primary" type="button" onClick={handleUploadCustom}>Upload to my shelf</button>
                  <p className="hint">Expected format: array of books or {"{ \"books\": [...] }"}</p>
                </div>
              </div>
              <div className="card" style={{ marginTop: "1rem" }}>
                <h3>Your custom books</h3>
                <div className="custom-shelf">
                  {customBooks.length === 0 && (
                    <div className="hint">No custom books yet.</div>
                  )}
                  {customBooks.map((book) => (
                    <div key={book.id} className="card custom-book">
                      <img
                        src={book.cover_url || "https://covers.openlibrary.org/b/id/10523365-M.jpg"}
                        alt={book.title}
                      />
                      <h4>{book.title}</h4>
                      <div>{book.author}</div>
                      <div className="tag">{book.category}</div>
                      <div>{money(book.price)}</div>
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => addFavorite({ customBookId: book.id })}
                      >
                        Favorite
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {view === "rentals" && (
            <section className="panel">
              <h2>Your rentals</h2>
              <div className="stacked">
                <div className="card">
                  <h3>History</h3>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Rented</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyRentals.map((row) => (
                          <tr key={row.id}>
                            <td>{row.title}</td>
                            <td>{row.category}</td>
                            <td>{money(row.price)}</td>
                            <td>{new Date(row.rented_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <h3>Currently rented</h3>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Rented</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentRentals.map((row) => (
                          <tr key={row.id}>
                            <td>{row.title}</td>
                            <td>{row.category}</td>
                            <td>{money(row.price)}</td>
                            <td>{new Date(row.rented_at).toLocaleDateString()}</td>
                            <td>
                              <button
                                className="secondary"
                                type="button"
                                onClick={() => returnRental(row.id)}
                              >
                                Return
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === "analytics" && (
            <section className="panel">
              <h2>Your reading signal</h2>
              <div className="split">
                <div className="card">
                  <h3>Rentals over time</h3>
                  <div className="chart-wrap">
                    {userTrendChart && (
                      <ChartCanvas type="line" data={userTrendChart.data} options={userTrendChart.options} />
                    )}
                  </div>
                </div>
                <div className="card">
                  <h3>Categories</h3>
                  <div className="chart-wrap">
                    {userCategoryChart && (
                      <ChartCanvas type="bar" data={userCategoryChart.data} options={userCategoryChart.options} />
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === "admin" && adminVisible && (
            <section className="panel" id="view-admin">
              <h2>Admin studio</h2>
              <div className="split admin-grid">
                <div className="card">
                  <h3>Totals</h3>
                  {adminStats ? (
                    <div>
                      <div><strong>Users:</strong> {adminStats.totals.users}</div>
                      <div><strong>Books:</strong> {adminStats.totals.books}</div>
                      <div><strong>Rentals:</strong> {adminStats.totals.rentals}</div>
                    </div>
                  ) : (
                    <div className="hint">Loading...</div>
                  )}
                </div>
                <div className="card">
                  <h3>User budgets</h3>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Budget</th>
                          <th>Update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.map((row) => (
                          <tr key={row.id}>
                            <td>{row.name}</td>
                            <td>{row.email}</td>
                            <td>{row.role}</td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                value={budgetEdits[row.id] ?? Number(row.budget).toFixed(2)}
                                onChange={(event) =>
                                  setBudgetEdits((prev) => ({
                                    ...prev,
                                    [row.id]: event.target.value,
                                  }))
                                }
                              />
                            </td>
                            <td>
                              <button className="secondary" type="button" onClick={() => updateBudget(row.id)}>
                                Save
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card admin-form-card">
                  <h3>Add a new book</h3>
                  <div className="admin-form">
                    <input ref={addBookTitleRef} type="text" placeholder="Title" />
                    <input ref={addBookAuthorRef} type="text" placeholder="Author" />
                    <input ref={addBookCategoryRef} type="text" placeholder="Category" />
                    <input ref={addBookPriceRef} type="number" min="0" placeholder="Price" />
                    <input ref={addBookStockRef} type="number" min="0" placeholder="Stock (1-10 default)" />
                    <input ref={addBookCoverRef} type="text" placeholder="Cover URL (optional)" />
                    <button className="primary" type="button" onClick={handleAddBook}>Add book</button>
                  </div>
                </div>
                <div className="card admin-form-card">
                  <h3>Import books (JSON)</h3>
                  <div className="admin-form">
                    <input ref={adminBooksFileRef} type="file" accept="application/json" />
                    <button className="primary" type="button" onClick={handleImportBooks}>Import to library</button>
                  </div>
                  <p className="hint">Expected format: array of books or {"{ \"books\": [...] }"}</p>
                </div>
                <div className="card">
                  <h3>Book stock</h3>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Stock</th>
                          <th>Update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminBooks.map((row) => (
                          <tr key={row.id}>
                            <td>{row.title}</td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                value={stockEdits[row.id] ?? row.stock}
                                onChange={(event) =>
                                  setStockEdits((prev) => ({
                                    ...prev,
                                    [row.id]: event.target.value,
                                  }))
                                }
                              />
                            </td>
                            <td>
                              <button className="secondary" type="button" onClick={() => updateStock(row.id)}>
                                Save
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="split admin-charts" style={{ marginTop: "1rem" }}>
                {adminCharts.map((chart) => (
                  <div key={chart.key} className="card">
                    <h3>{chart.label}</h3>
                    <div className="chart-wrap">
                      <ChartCanvas type="line" data={chart.chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <footer>
        Riubs Library - curated shelves, personal budgets, and reading analytics.
      </footer>
    </div>
  );
}

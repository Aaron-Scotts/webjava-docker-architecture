import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AUTH_TOKEN_KEY } from "../config/auth.js";
import {
  VIEW_ADMIN,
  VIEW_ANALYTICS,
  VIEW_AUTH,
  VIEW_DASHBOARD,
  VIEW_FAVORITES,
  VIEW_LIBRARY,
  VIEW_RENTALS,
} from "../config/views.js";
import { useToast } from "./useToast.js";
import { apiRequest } from "../services/api.js";
import { parseBooksPayload } from "../utils/books.js";

export function useLibraryApp() {
  const [status, setStatus] = useState("Not signed in");
  const [view, setView] = useState(VIEW_AUTH);
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
  const [budgetEdits, setBudgetEdits] = useState({});
  const [stockEdits, setStockEdits] = useState({});

  const { toasts, showToast } = useToast();

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

  const apiFetch = useCallback(
    async (path, options = {}) => {
      const headers = { ...(options.headers || {}) };
      const authToken = token || localStorage.getItem(AUTH_TOKEN_KEY);

      if (authToken && !headers.Authorization && !headers.authorization) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      return apiRequest(path, { ...options, headers });
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
    const [currentData, historyData] = await Promise.all([
      apiFetch("/api/rentals/current"),
      apiFetch("/api/rentals/history"),
    ]);
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
    } catch (error) {
      console.warn("Profile refresh failed", error);
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
  }, [loadProfile, loadBooks, loadFavorites, loadCustomBooks, loadRentals, loadUserStats, loadAdminData]);

  const loadSession = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (storedToken && !token) {
        setToken(storedToken);
      }

      const data = await apiFetch("/auth/validate");
      setUser(data.user);
      setStatus(`Signed in as ${data.user.name} (${data.user.role})`);
      setView(VIEW_DASHBOARD);
      await refreshAll();
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setStatus("Not signed in");
      setView(VIEW_AUTH);
    }
  }, [apiFetch, refreshAll, token]);

  useEffect(() => {
    loadBooks();
    loadSession();
  }, []);

  const adminVisible = user?.role === "admin";

  const reloadView = useCallback(
    (nextView) => {
      if (nextView === VIEW_DASHBOARD) {
        refreshAll();
      }
      if (nextView === VIEW_LIBRARY) {
        loadBooks();
      }
      if (nextView === VIEW_FAVORITES) {
        loadFavorites();
        loadCustomBooks();
      }
      if (nextView === VIEW_RENTALS) {
        loadRentals();
      }
      if (nextView === VIEW_ANALYTICS) {
        loadUserStats();
      }
      if (nextView === VIEW_ADMIN && adminVisible) {
        loadAdminData();
      }
    },
    [adminVisible, refreshAll, loadBooks, loadFavorites, loadCustomBooks, loadRentals, loadUserStats, loadAdminData]
  );

  const handleNav = useCallback((nextView) => {
    if (nextView === VIEW_FAVORITES && !user) {
      setView(VIEW_AUTH);
      showToast("Sign in", "Please sign in to view favorites.", "error");
      return;
    }

    setView(nextView);
    reloadView(nextView);
  }, [reloadView, showToast, user]);

  useEffect(() => {
    reloadView(view);
  }, [reloadView, view]);

  const handleLogin = useCallback(async () => {
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
      setView(VIEW_DASHBOARD);
      await refreshAll();
    } catch (error) {
      showToast("Login failed", error.message, "error");
    }
  }, [apiFetch, refreshAll, showToast]);

  const handleRegister = useCallback(async () => {
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
    } catch (error) {
      showToast("Register failed", error.message, "error");
    }
  }, [apiFetch, showToast]);

  const handleLogout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (error) {
      console.warn(error);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setStatus("Not signed in");
    setView(VIEW_AUTH);
  }, [apiFetch]);

  const addFavorite = useCallback(async (payload) => {
    try {
      await apiFetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await loadFavorites();
    } catch (error) {
      showToast("Favorite failed", error.message, "error");
    }
  }, [apiFetch, loadFavorites, showToast]);

  const removeFavorite = useCallback(async (favoriteId) => {
    try {
      await apiFetch(`/api/favorites/${favoriteId}`, { method: "DELETE" });
      await loadFavorites();
    } catch (error) {
      showToast("Remove failed", error.message, "error");
    }
  }, [apiFetch, loadFavorites, showToast]);

  const rentBook = useCallback(async (bookId) => {
    try {
      const result = await apiFetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      setUser((prev) => (prev ? { ...prev, budget: result.budget } : prev));
      await refreshAll();
      const match = books.find((book) => book.id === bookId);
      showToast("Rental confirmed", `You rented ${match?.title || "this book"}.`, "rent");
    } catch (error) {
      showToast("Rental failed", error.message, "error");
    }
  }, [apiFetch, books, refreshAll, showToast]);

  const returnRental = useCallback(async (rentalId) => {
    try {
      await apiFetch(`/api/rentals/${rentalId}/return`, { method: "POST" });
      await loadRentals();
      await loadBooks();
      showToast("Rental closed", "You returned a rental.", "return");
    } catch (error) {
      showToast("Return failed", error.message, "error");
    }
  }, [apiFetch, loadBooks, loadRentals, showToast]);

  const handleAddBook = useCallback(async () => {
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
    } catch (error) {
      showToast("Add failed", error.message, "error");
    }
  }, [apiFetch, loadAdminData, loadBooks, showToast]);

  const handleImportBooks = useCallback(async () => {
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
    } catch (error) {
      showToast("Import failed", error.message, "error");
    }
  }, [apiFetch, loadAdminData, loadBooks, showToast]);

  const handleUploadCustom = useCallback(async () => {
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
    } catch (error) {
      showToast("Upload failed", error.message, "error");
    }
  }, [apiFetch, loadCustomBooks, showToast]);

  const updateBudget = useCallback(async (userId) => {
    try {
      const budget = Number(budgetEdits[userId]);
      await apiFetch(`/api/admin/users/${userId}/budget`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget }),
      });
      await loadAdminData();
      showToast("Budget updated", "User budget updated.");
    } catch (error) {
      showToast("Update failed", error.message, "error");
    }
  }, [apiFetch, budgetEdits, loadAdminData, showToast]);

  const updateStock = useCallback(async (bookId) => {
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
    } catch (error) {
      showToast("Update failed", error.message, "error");
    }
  }, [apiFetch, loadAdminData, loadBooks, showToast, stockEdits]);

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
      { key: "users", label: "Users", color: "#111827", data: adminStats.usersByMonth },
      { key: "books", label: "Books", color: "#ff6b35", data: adminStats.booksByMonth },
      { key: "rentals", label: "Rentals", color: "#556b2f", data: adminStats.rentalsByMonth },
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

  return {
    status,
    view,
    user,
    books,
    favorites,
    customBooks,
    currentRentals,
    historyRentals,
    adminVisible,
    adminStats,
    adminUsers,
    adminBooks,
    budgetEdits,
    stockEdits,
    toasts,
    userTrendChart,
    userCategoryChart,
    adminCharts,
    refs: {
      loginEmailRef,
      loginPasswordRef,
      registerNameRef,
      registerEmailRef,
      registerPasswordRef,
      addBookTitleRef,
      addBookAuthorRef,
      addBookCategoryRef,
      addBookPriceRef,
      addBookStockRef,
      addBookCoverRef,
      adminBooksFileRef,
      customBooksFileRef,
    },
    actions: {
      setView,
      handleNav,
      handleLogin,
      handleRegister,
      handleLogout,
      addFavorite,
      removeFavorite,
      rentBook,
      returnRental,
      handleAddBook,
      handleImportBooks,
      handleUploadCustom,
      setBudgetEdits,
      setStockEdits,
      updateBudget,
      updateStock,
    },
  };
}

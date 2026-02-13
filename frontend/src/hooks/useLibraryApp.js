import { useCallback, useEffect, useState } from "react";
import { AUTH_TOKEN_KEY } from "../config/auth.js";
import { VIEW_AUTH, VIEW_FAVORITES } from "../config/views.js";
import { useToast } from "./useToast.js";
import { apiRequest } from "../services/api.js";
import { useLibraryRefs } from "./library/useLibraryRefs.js";
import { useLibraryLoaders } from "./library/useLibraryLoaders.js";
import { useLibraryActions } from "./library/useLibraryActions.js";
import { useLibraryCharts } from "./library/useLibraryCharts.js";

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
  const refs = useLibraryRefs();
  const adminVisible = user?.role === "admin";

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

  const {
    loadBooks,
    loadFavorites,
    loadCustomBooks,
    loadRentals,
    loadAdminData,
    refreshAll,
    loadSession,
    reloadView,
  } = useLibraryLoaders({
    apiFetch,
    token,
    user,
    adminVisible,
    setToken,
    setUser,
    setStatus,
    setView,
    setBooks,
    setFavorites,
    setCustomBooks,
    setCurrentRentals,
    setHistoryRentals,
    setUserStats,
    setAdminStats,
    setAdminUsers,
    setAdminBooks,
  });

  const domainActions = useLibraryActions({
    apiFetch,
    refs,
    showToast,
    books,
    budgetEdits,
    stockEdits,
    setToken,
    setUser,
    setStatus,
    setView,
    loadFavorites,
    loadCustomBooks,
    loadRentals,
    loadBooks,
    loadAdminData,
    refreshAll,
  });

  const handleNav = useCallback(
    (nextView) => {
      if (nextView === VIEW_FAVORITES && !user) {
        setView(VIEW_AUTH);
        showToast("Sign in", "Please sign in to view favorites.", "error");
        return;
      }

      setView(nextView);
      reloadView(nextView);
    },
    [reloadView, showToast, user]
  );

  const charts = useLibraryCharts({ userStats, adminStats });

  useEffect(() => {
    loadBooks();
    loadSession();
  }, [loadBooks, loadSession]);

  useEffect(() => {
    reloadView(view);
  }, [reloadView, view]);

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
    userTrendChart: charts.userTrendChart,
    userCategoryChart: charts.userCategoryChart,
    adminCharts: charts.adminCharts,
    refs,
    actions: {
      setView,
      handleNav,
      ...domainActions,
      setBudgetEdits,
      setStockEdits,
    },
  };
}

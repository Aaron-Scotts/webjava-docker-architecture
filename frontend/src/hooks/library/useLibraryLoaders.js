import { useCallback } from "react";
import { AUTH_TOKEN_KEY } from "../../config/auth.js";
import {VIEW_ADMIN,VIEW_ANALYTICS,VIEW_AUTH,VIEW_DASHBOARD,VIEW_FAVORITES,VIEW_LIBRARY,VIEW_RENTALS,
} from "../../config/views.js";

export function useLibraryLoaders({apiFetch,token,user,adminVisible,setToken,setUser,setStatus,setView,setBooks,setFavorites,setCustomBooks,setCurrentRentals,setHistoryRentals,setUserStats,setAdminStats,setAdminUsers,setAdminBooks,
}) {
  const loadBooks = useCallback(async () => {
    const data = await apiFetch("/api/books");
    setBooks(data);
  }, [apiFetch, setBooks]);

  const loadFavorites = useCallback(async () => {
    if (!user) {
      return;
    }
    const data = await apiFetch("/api/favorites");
    setFavorites(data);
  }, [apiFetch, setFavorites, user]);

  const loadCustomBooks = useCallback(async () => {
    if (!user) {
      return;
    }
    const data = await apiFetch("/api/custom-books");
    setCustomBooks(data);
  }, [apiFetch, setCustomBooks, user]);

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
  }, [apiFetch, setCurrentRentals, setHistoryRentals, user]);

  const loadUserStats = useCallback(async () => {
    if (!user) {
      return;
    }
    const data = await apiFetch("/api/stats/user");
    setUserStats(data);
  }, [apiFetch, setUserStats, user]);

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
  }, [apiFetch, setAdminBooks, setAdminStats, setAdminUsers, user]);

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
  }, [apiFetch, setStatus, setUser, user]);

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
  }, [loadAdminData, loadBooks, loadCustomBooks, loadFavorites, loadProfile, loadRentals, loadUserStats]);

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
  }, [apiFetch, refreshAll, setStatus, setToken, setUser, setView, token]);

  const reloadView = useCallback((nextView) => {
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
  }, [adminVisible, loadAdminData, loadBooks, loadCustomBooks, loadFavorites, loadRentals, loadUserStats, refreshAll]);

  return {loadBooks,loadFavorites,loadCustomBooks,loadRentals,loadUserStats,loadAdminData,refreshAll,loadSession,reloadView,};
}

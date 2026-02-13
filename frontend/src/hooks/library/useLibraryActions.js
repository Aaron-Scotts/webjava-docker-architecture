import { useCallback } from "react";
import { AUTH_TOKEN_KEY } from "../../config/auth.js";
import { VIEW_AUTH, VIEW_DASHBOARD } from "../../config/views.js";
import { parseBooksPayload } from "../../utils/books.js";

export function useLibraryActions({apiFetch,refs,showToast,books,budgetEdits,stockEdits,setToken,setUser,setStatus,setView,loadFavorites,loadCustomBooks,loadRentals,loadBooks,loadAdminData,refreshAll,
}) {
  const handleLogin = useCallback(async () => {
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: refs.loginEmailRef.current?.value || "",
          password: refs.loginPasswordRef.current?.value || "",
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
  }, [apiFetch, refs.loginEmailRef, refs.loginPasswordRef, refreshAll, setStatus, setToken, setUser, setView, showToast]);

  const handleRegister = useCallback(async () => {
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: refs.registerNameRef.current?.value || "",
          email: refs.registerEmailRef.current?.value || "",
          password: refs.registerPasswordRef.current?.value || "",
        }),
      });
      showToast("Account created", "You can log in now.");
    } catch (error) {
      showToast("Register failed", error.message, "error");
    }
  }, [apiFetch, refs.registerEmailRef, refs.registerNameRef, refs.registerPasswordRef, showToast]);

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
  }, [apiFetch, setStatus, setToken, setUser, setView]);

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
  }, [apiFetch, books, refreshAll, setUser, showToast]);

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
          title: refs.addBookTitleRef.current?.value || "",
          author: refs.addBookAuthorRef.current?.value || "",
          category: refs.addBookCategoryRef.current?.value || "",
          price: Number(refs.addBookPriceRef.current?.value || 0),
          stock: refs.addBookStockRef.current?.value || undefined,
          coverUrl: refs.addBookCoverRef.current?.value || null,
        }),
      });
      await loadBooks();
      await loadAdminData();
      showToast("Book added", "New book added to the library.");
    } catch (error) {
      showToast("Add failed", error.message, "error");
    }
  }, [apiFetch, loadAdminData, loadBooks, refs.addBookAuthorRef, refs.addBookCategoryRef, refs.addBookCoverRef, refs.addBookPriceRef, refs.addBookStockRef, refs.addBookTitleRef, showToast]);

  const handleImportBooks = useCallback(async () => {
    try {
      const file = refs.adminBooksFileRef.current?.files?.[0];
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
  }, [apiFetch, loadAdminData, loadBooks, refs.adminBooksFileRef, showToast]);

  const handleUploadCustom = useCallback(async () => {
    try {
      const file = refs.customBooksFileRef.current?.files?.[0];
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
  }, [apiFetch, loadCustomBooks, refs.customBooksFileRef, showToast]);

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

  return {handleLogin,handleRegister,handleLogout,addFavorite,removeFavorite,rentBook,returnRental,handleAddBook,handleImportBooks,handleUploadCustom,updateBudget,updateStock,};
}

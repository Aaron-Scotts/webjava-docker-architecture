import { useCallback, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AppHeader from "./components/layout/AppHeader.jsx";
import SidebarNav from "./components/layout/SidebarNav.jsx";
import ToastHost from "./components/feedback/ToastHost.jsx";
import { useLibraryApp } from "./hooks/useLibraryApp.js";
import {VIEW_ADMIN,VIEW_ANALYTICS,VIEW_AUTH,VIEW_DASHBOARD,VIEW_FAVORITES,VIEW_LIBRARY,VIEW_RENTALS,pathToView,viewToPath,
} from "./config/views.js";
import AuthView from "./views/AuthView.jsx";
import DashboardView from "./views/DashboardView.jsx";
import LibraryView from "./views/LibraryView.jsx";
import FavoritesView from "./views/FavoritesView.jsx";
import RentalsView from "./views/RentalsView.jsx";
import AnalyticsView from "./views/AnalyticsView.jsx";
import AdminView from "./views/AdminView.jsx";

export default function App() {
  const app = useLibraryApp();
  const { handleNav, handleLogin, handleRegister, handleLogout, rentBook, addFavorite, removeFavorite, handleUploadCustom, returnRental, setBudgetEdits, setStockEdits, updateBudget, updateStock, handleAddBook, handleImportBooks } = app.actions;
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = pathToView(location.pathname);

  const navigateToView = useCallback(
    (nextView, options) => {
      navigate(viewToPath(nextView), options);
    },
    [navigate]
  );

  useEffect(() => {
    if (currentView === VIEW_FAVORITES && !app.user) {
      handleNav(VIEW_FAVORITES);
      navigateToView(VIEW_AUTH, { replace: true });
      return;
    }

    handleNav(currentView);
  }, [app.user, currentView, handleNav, navigateToView]);

  useEffect(() => {
    if (app.view !== currentView) {
      navigateToView(app.view, { replace: true });
    }
  }, [app.view, currentView, navigateToView]);

  return (
    <div>
      <AppHeader
        status={app.status}
        user={app.user}
        onLogout={handleLogout}
        onSignIn={() => navigateToView(VIEW_AUTH)}
      />

      <ToastHost toasts={app.toasts} />

      <div className="shell">
        <SidebarNav adminVisible={app.adminVisible} />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to={viewToPath(VIEW_AUTH)} replace />} />
            <Route path={viewToPath(VIEW_AUTH)} element={<AuthView refs={app.refs} onLogin={handleLogin} onRegister={handleRegister} />} />
            <Route path={viewToPath(VIEW_DASHBOARD)} element={<DashboardView user={app.user} books={app.books} currentRentals={app.currentRentals} historyRentals={app.historyRentals} />} />
            <Route path={viewToPath(VIEW_LIBRARY)} element={<LibraryView books={app.books} onRent={rentBook} onFavorite={addFavorite} />} />
            <Route
              path={viewToPath(VIEW_FAVORITES)}
              element={
                <FavoritesView
                  favorites={app.favorites}
                  customBooks={app.customBooks}
                  customBooksFileRef={app.refs.customBooksFileRef}
                  onRemoveFavorite={removeFavorite}
                  onUploadCustom={handleUploadCustom}
                  onFavorite={addFavorite}
                />
              }
            />
            <Route path={viewToPath(VIEW_RENTALS)} element={<RentalsView currentRentals={app.currentRentals} historyRentals={app.historyRentals} onReturn={returnRental} />} />
            <Route path={viewToPath(VIEW_ANALYTICS)} element={<AnalyticsView userTrendChart={app.userTrendChart} userCategoryChart={app.userCategoryChart} />} />
            <Route
              path={viewToPath(VIEW_ADMIN)}
              element={
                app.adminVisible ? (
                  <AdminView
                    adminStats={app.adminStats}
                    adminUsers={app.adminUsers}
                    adminBooks={app.adminBooks}
                    adminCharts={app.adminCharts}
                    budgetEdits={app.budgetEdits}
                    stockEdits={app.stockEdits}
                    refs={app.refs}
                    onBudgetEdit={setBudgetEdits}
                    onStockEdit={setStockEdits}
                    onUpdateBudget={updateBudget}
                    onUpdateStock={updateStock}
                    onAddBook={handleAddBook}
                    onImportBooks={handleImportBooks}
                  />
                ) : (
                  <Navigate to={viewToPath(VIEW_AUTH)} replace />
                )
              }
            />
            <Route path="*" element={<Navigate to={viewToPath(VIEW_AUTH)} replace />} />
          </Routes>
        </main>
      </div>

      <footer>Riubs Library - curated shelves, personal budgets, and reading analytics.</footer>
    </div>
  );
}

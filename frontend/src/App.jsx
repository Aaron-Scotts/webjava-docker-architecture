import AppHeader from "./components/layout/AppHeader.jsx";
import SidebarNav from "./components/layout/SidebarNav.jsx";
import ToastHost from "./components/feedback/ToastHost.jsx";
import { useLibraryApp } from "./hooks/useLibraryApp.js";
import { VIEW_ADMIN, VIEW_ANALYTICS, VIEW_AUTH, VIEW_DASHBOARD, VIEW_FAVORITES, VIEW_LIBRARY, VIEW_RENTALS } from "./config/views.js";
import AuthView from "./views/AuthView.jsx";
import DashboardView from "./views/DashboardView.jsx";
import LibraryView from "./views/LibraryView.jsx";
import FavoritesView from "./views/FavoritesView.jsx";
import RentalsView from "./views/RentalsView.jsx";
import AnalyticsView from "./views/AnalyticsView.jsx";
import AdminView from "./views/AdminView.jsx";

function ActiveView({ app }) {
  if (app.view === VIEW_AUTH) {
    return <AuthView refs={app.refs} onLogin={app.actions.handleLogin} onRegister={app.actions.handleRegister} />;
  }

  if (app.view === VIEW_DASHBOARD) {
    return <DashboardView user={app.user} books={app.books} currentRentals={app.currentRentals} historyRentals={app.historyRentals} />;
  }

  if (app.view === VIEW_LIBRARY) {
    return <LibraryView books={app.books} onRent={app.actions.rentBook} onFavorite={app.actions.addFavorite} />;
  }

  if (app.view === VIEW_FAVORITES) {
    return (
      <FavoritesView
        favorites={app.favorites}
        customBooks={app.customBooks}
        customBooksFileRef={app.refs.customBooksFileRef}
        onRemoveFavorite={app.actions.removeFavorite}
        onUploadCustom={app.actions.handleUploadCustom}
        onFavorite={app.actions.addFavorite}
      />
    );
  }

  if (app.view === VIEW_RENTALS) {
    return <RentalsView currentRentals={app.currentRentals} historyRentals={app.historyRentals} onReturn={app.actions.returnRental} />;
  }

  if (app.view === VIEW_ANALYTICS) {
    return <AnalyticsView userTrendChart={app.userTrendChart} userCategoryChart={app.userCategoryChart} />;
  }

  if (app.view === VIEW_ADMIN && app.adminVisible) {
    return (
      <AdminView
        adminStats={app.adminStats}
        adminUsers={app.adminUsers}
        adminBooks={app.adminBooks}
        adminCharts={app.adminCharts}
        budgetEdits={app.budgetEdits}
        stockEdits={app.stockEdits}
        refs={app.refs}
        onBudgetEdit={app.actions.setBudgetEdits}
        onStockEdit={app.actions.setStockEdits}
        onUpdateBudget={app.actions.updateBudget}
        onUpdateStock={app.actions.updateStock}
        onAddBook={app.actions.handleAddBook}
        onImportBooks={app.actions.handleImportBooks}
      />
    );
  }

  return null;
}

export default function App() {
  const app = useLibraryApp();

  return (
    <div>
      <AppHeader status={app.status} user={app.user} onLogout={app.actions.handleLogout} onSignIn={() => app.actions.setView(VIEW_AUTH)} />

      <ToastHost toasts={app.toasts} />

      <div className="shell">
        <SidebarNav currentView={app.view} onNavigate={app.actions.handleNav} adminVisible={app.adminVisible} />
        <main>
          <ActiveView app={app} />
        </main>
      </div>

      <footer>Riubs Library - curated shelves, personal budgets, and reading analytics.</footer>
    </div>
  );
}

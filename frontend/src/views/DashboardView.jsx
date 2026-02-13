import { money } from "../utils/money.js";

export default function DashboardView({ user, books, currentRentals, historyRentals }) {
  const cards = [
    { label: "Budget", value: money(user?.budget || 0) },
    { label: "Current rentals", value: currentRentals.length },
    { label: "History", value: historyRentals.length },
    { label: "Books in library", value: books.length },
  ];

  return (
    <section className="panel">
      <h2>Personal dashboard</h2>
      <div className="grid cards">
        {cards.map((item) => (
          <div key={item.label} className="card">
            <strong>{item.label}</strong>
            <div className="card-metric">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

import ChartCanvas from "../components/ChartCanvas.jsx";

export default function AdminView({adminStats,adminUsers,adminBooks,adminCharts,budgetEdits,stockEdits,refs,onBudgetEdit,onStockEdit,onUpdateBudget,onUpdateStock,onAddBook,onImportBooks,
}) {
  return (
    <section className="panel" id="view-admin">
      <h2>Admin studio</h2>
      <div className="split admin-grid">
        <div className="card">
          <h3>Totals</h3>
          {adminStats ? (
            <div>
              <div>
                <strong>Users:</strong> {adminStats.totals.users}
              </div>
              <div>
                <strong>Books:</strong> {adminStats.totals.books}
              </div>
              <div>
                <strong>Rentals:</strong> {adminStats.totals.rentals}
              </div>
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
                          onBudgetEdit((prev) => ({
                            ...prev,
                            [row.id]: event.target.value,
                          }))
                        }
                      />
                    </td>
                    <td>
                      <button className="secondary" type="button" onClick={() => onUpdateBudget(row.id)}>
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
            <input ref={refs.addBookTitleRef} type="text" placeholder="Title" />
            <input ref={refs.addBookAuthorRef} type="text" placeholder="Author" />
            <input ref={refs.addBookCategoryRef} type="text" placeholder="Category" />
            <input ref={refs.addBookPriceRef} type="number" min="0" placeholder="Price" />
            <input ref={refs.addBookStockRef} type="number" min="0" placeholder="Stock (1-10 default)" />
            <input ref={refs.addBookCoverRef} type="text" placeholder="Cover URL (optional)" />
            <button className="primary" type="button" onClick={onAddBook}>
              Add book
            </button>
          </div>
        </div>

        <div className="card admin-form-card">
          <h3>Import books (JSON)</h3>
          <div className="admin-form">
            <input ref={refs.adminBooksFileRef} type="file" accept="application/json" />
            <button className="primary" type="button" onClick={onImportBooks}>
              Import to library
            </button>
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
                          onStockEdit((prev) => ({
                            ...prev,
                            [row.id]: event.target.value,
                          }))
                        }
                      />
                    </td>
                    <td>
                      <button className="secondary" type="button" onClick={() => onUpdateStock(row.id)}>
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
  );
}

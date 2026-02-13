import { money } from "../utils/money.js";

function RentalTable({ rows, withAction = false, onReturn }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Price</th>
            <th>Rented</th>
            {withAction && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.title}</td>
              <td>{row.category}</td>
              <td>{money(row.price)}</td>
              <td>{new Date(row.rented_at).toLocaleDateString()}</td>
              {withAction && (
                <td>
                  <button className="secondary" type="button" onClick={() => onReturn(row.id)}>
                    Return
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RentalsView({ currentRentals, historyRentals, onReturn }) {
  return (
    <section className="panel">
      <h2>Your rentals</h2>
      <div className="stacked">
        <div className="card">
          <h3>History</h3>
          <RentalTable rows={historyRentals} />
        </div>
        <div className="card">
          <h3>Currently rented</h3>
          <RentalTable rows={currentRentals} withAction onReturn={onReturn} />
        </div>
      </div>
    </section>
  );
}

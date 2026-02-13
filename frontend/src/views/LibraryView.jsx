import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { money } from "../utils/money.js";

export default function LibraryView({ books, onRent, onFavorite }) {
  const defaultColDef = useMemo(() => ({ sortable: true, resizable: true, flex: 1 }), []);

  const columnDefs = useMemo(
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
              <button className="primary" type="button" onClick={() => onRent(params.data.id)}>
                Rent
              </button>
              <button className="secondary" type="button" onClick={() => onFavorite({ bookId: params.data.id })}>
                Favorite
              </button>
            </div>
          );
        },
      },
    ],
    [onFavorite, onRent]
  );

  return (
    <section className="panel">
      <h2>Library collection</h2>
      <div className="card grid-frame ag-theme-alpine">
        <AgGridReact
          rowData={books}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={52}
          getRowId={(params) => String(params.data.id)}
        />
      </div>
    </section>
  );
}

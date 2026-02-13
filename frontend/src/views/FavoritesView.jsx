import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { money } from "../utils/money.js";

export default function FavoritesView({
  favorites,
  customBooks,
  customBooksFileRef,
  onRemoveFavorite,
  onUploadCustom,
  onFavorite,
}) {
  const defaultColDef = useMemo(() => ({ sortable: true, resizable: true, flex: 1 }), []);

  const columnDefs = useMemo(
    () => [
      { field: "title", headerName: "Title", minWidth: 180 },
      { field: "author", headerName: "Author", minWidth: 160 },
      { field: "category", headerName: "Category", minWidth: 140 },
      { field: "source", headerName: "Source", maxWidth: 130 },
      {
        field: "price",
        headerName: "Price",
        valueFormatter: (params) => money(params.value),
        maxWidth: 130,
      },
      {
        headerName: "Actions",
        minWidth: 170,
        cellRenderer: (params) => {
          if (!params.data) {
            return null;
          }
          return (
            <button
              className="secondary"
              type="button"
              onClick={() => onRemoveFavorite(params.data.favorite_id || params.data.id)}
            >
              Remove
            </button>
          );
        },
      },
    ],
    [onRemoveFavorite]
  );

  return (
    <section className="panel">
      <h2>Your favorites</h2>
      <div className="split">
        <div className="card">
          <h3>Favorites list</h3>
          <div className="grid-frame ag-theme-alpine">
            <AgGridReact
              rowData={favorites}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowHeight={52}
              getRowId={(params) => String(params.data.favorite_id || params.data.id)}
            />
          </div>
        </div>
        <div className="card">
          <h3>Upload custom books (JSON)</h3>
          <input ref={customBooksFileRef} type="file" accept="application/json" />
          <button className="primary" type="button" onClick={onUploadCustom}>
            Upload to my shelf
          </button>
          <p className="hint">Expected format: array of books or {"{ \"books\": [...] }"}</p>
        </div>
      </div>
      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Your custom books</h3>
        <div className="custom-shelf">
          {customBooks.length === 0 && <div className="hint">No custom books yet.</div>}
          {customBooks.map((book) => (
            <div key={book.id} className="card custom-book">
              <img
                src={book.cover_url || "https://covers.openlibrary.org/b/id/10523365-M.jpg"}
                alt={book.title}
              />
              <h4>{book.title}</h4>
              <div>{book.author}</div>
              <div className="tag">{book.category}</div>
              <div>{money(book.price)}</div>
              <button className="secondary" type="button" onClick={() => onFavorite({ customBookId: book.id })}>
                Favorite
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function parseBooksPayload(text) {
  const payload = JSON.parse(text);
  const books = Array.isArray(payload) ? payload : payload.books;

  if (!Array.isArray(books)) {
    throw new Error("invalid_json");
  }

  return books;
}

import { useRef } from "react";

export function useLibraryRefs() {
  return {
    loginEmailRef: useRef(null),
    loginPasswordRef: useRef(null),
    registerNameRef: useRef(null),
    registerEmailRef: useRef(null),
    registerPasswordRef: useRef(null),
    addBookTitleRef: useRef(null),
    addBookAuthorRef: useRef(null),
    addBookCategoryRef: useRef(null),
    addBookPriceRef: useRef(null),
    addBookStockRef: useRef(null),
    addBookCoverRef: useRef(null),
    adminBooksFileRef: useRef(null),
    customBooksFileRef: useRef(null),
  };
}

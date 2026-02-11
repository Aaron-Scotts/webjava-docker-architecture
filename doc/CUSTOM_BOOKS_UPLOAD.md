# Upload de livres custom (JSON)

## 1) But
Permettre a un utilisateur (ou admin) d ajouter des livres personalises a sa propre bibliotheque via un fichier JSON.

## 2) Endpoint
- POST /api/custom-books/import
- Authentifie via cookie (riubs_auth)

## 3) Format JSON accepte
Deux formats sont acceptes:

### A) Tableau simple
```json
[
  {
    "title": "Custom Book 1",
    "author": "Author X",
    "category": "History",
    "price": 90,
    "coverUrl": "https://example.com/cover.jpg"
  },
  {
    "title": "Custom Book 2",
    "author": "Author Y",
    "category": "Science",
    "price": 120
  }
]
```

### B) Objet avec cle books
```json
{
  "books": [
    {
      "title": "Custom Book 3",
      "author": "Author Z",
      "category": "Tech",
      "price": 150,
      "coverUrl": "https://example.com/cover2.jpg"
    }
  ]
}
```

Champs obligatoires par livre:
- title
- author
- category
- price

Champs optionnels:
- coverUrl

## 4) Exemple curl
```bash
curl -i -X POST http://192.168.49.2:32295/api/custom-books/import \
  -H "Content-Type: application/json" \
  -H "Cookie: riubs_auth=VOTRE_TOKEN" \
  -d '{"books":[{"title":"Custom Book","author":"Me","category":"Art","price":99}]}'
```

## 5) Resultat attendu
- Reponse JSON: { "inserted": <nombre> }
- Les livres apparaissent dans l onglet Favorites -> Custom books

## 6) Notes
- Les livres custom sont stockes dans la table custom_books
- Les favoris sont stockes dans favorite_books

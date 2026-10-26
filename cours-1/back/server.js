const express = require("express");

const PORT = 3000;
const app = express();

// Seul exemple de lignes publié dans le contrat (scope "season").
// Les rangs 3 à 9 n'y figurent pas : ils ne sont pas ajoutés.
const EXAMPLE_ROWS = [
  {
    rank: 1,
    id: 6,
    pseudo: "Ishak MESSAOUDI",
    team: null,
    level: 3,
    xp: 533,
  },
  {
    rank: 2,
    id: 2,
    pseudo: "Jérémy",
    team: null,
    level: 3,
    xp: 496,
  },
  {
    rank: 10,
    id: 1,
    pseudo: "Dylan",
    team: null,
    level: 1,
    xp: 0,
  },
];

const SCOPES = ["season", "today"];

function errorBody(code, message) {
  return { error: { code, message } };
}

app.get("/api/leaderboard", (req, res) => {
  const hasScope = Object.prototype.hasOwnProperty.call(req.query, "scope");
  const scope = hasScope ? req.query.scope : "season";

  if (!SCOPES.includes(scope)) {
    res
      .status(400)
      .json(
        errorBody(
          "INVALID_PARAM",
          "Le paramètre 'scope' doit être 'season' ou 'today'."
        )
      );
    return;
  }

  // Le contrat décrit un 401 (code de classe absent ou expiré)
  // mais ne dit pas où ce code est envoyé. Aucun contrôle n'est ajouté.

  res.status(200).json({ scope, rows: EXAMPLE_ROWS });
});

app.use((err, req, res, next) => {
  res
    .status(500)
    .json(errorBody("SERVER_ERROR", "Une erreur inattendue est survenue"));
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}/api/leaderboard`);
});

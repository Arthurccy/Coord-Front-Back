/**
 * Implémentation Front-End du Classement (Leaderboard)
 * ----------------------------------------------------
 * Basée STRICTEMENT sur le contrat reçu : "contrat-api-leaderboard-victor-remi.yaml"
 * 
 * Points clés du contrat implémentés :
 * - Route : GET /api/leaderboard?scope=season|today (paramètre 'scope', pas 'periode')
 * - Structure de réponse : { scope: string, rows: LeaderboardRow[] }
 * - Structure d'une ligne : { rank, id, pseudo, team, level, xp }
 * - Affichage de l'équipe : si 'team === null', affichage de "—"
 * - Rangs 1, 2, 3 dorés : calculé côté Front via (rank <= 3)
 * - Gestion d'erreur conforme au schéma ErrorResponse : { error: { code, message } }
 */

// Configuration de l'environnement
const CONFIG = {
  // En mode API réelle, le Front appelle l'API locale du Back
  apiBaseUrl: "http://localhost:3000/api/leaderboard",
  useMock: true // Vrai par défaut pour l'atelier sans backend initial
};

// --- JEU DE DONNÉES MOCKÉ (Conforme à 100% au contrat de Victor & Rémi) ---
const MOCK_LEADERBOARD = {
  season: {
    scope: "season",
    rows: [
      { rank: 1,  id: 6,  pseudo: "Ishak MESSAOUDI", team: null, level: 3, xp: 533 },
      { rank: 2,  id: 2,  pseudo: "Jérémy",          team: null, level: 3, xp: 496 },
      { rank: 3,  id: 7,  pseudo: "clément lisnard",  team: null, level: 3, xp: 388 },
      { rank: 4,  id: 9,  pseudo: "Rémi",             team: null, level: 3, xp: 300 },
      { rank: 5,  id: 3,  pseudo: "Léo",              team: null, level: 2, xp: 271 },
      { rank: 6,  id: 11, pseudo: "Victor",           team: null, level: 2, xp: 238 },
      { rank: 7,  id: 4,  pseudo: "Mathias",          team: null, level: 2, xp: 226 },
      { rank: 8,  id: 8,  pseudo: "Arthur Courchay",  team: null, level: 2, xp: 151 },
      { rank: 9,  id: 5,  pseudo: "Loris",            team: null, level: 2, xp: 113 },
      { rank: 10, id: 1,  pseudo: "Dylan",            team: null, level: 1, xp: 0   },
      { rank: 11, id: 10, pseudo: "Dylan_Test",       team: null, level: 1, xp: 0   }
    ]
  },
  today: {
    scope: "today",
    rows: [
      { rank: 1,  id: 6,  pseudo: "Ishak MESSAOUDI", team: null, level: 3, xp: 85 },
      { rank: 2,  id: 9,  pseudo: "Rémi",             team: null, level: 3, xp: 60 },
      { rank: 3,  id: 2,  pseudo: "Jérémy",          team: null, level: 3, xp: 45 }
    ]
  }
};

// État local de la vue
let currentScope = "season"; // 'season' ou 'today'

// Références DOM
const tbody = document.getElementById("leaderboard-body");
const tabSeason = document.getElementById("tab-season");
const tabToday = document.getElementById("tab-today");
const errorBanner = document.getElementById("error-banner");
const errorMessage = document.getElementById("error-message");
const modeBadge = document.getElementById("mode-badge");
const btnToggleMode = document.getElementById("btn-toggle-mode");

/**
 * Récupère les données depuis l'API ou le mock selon le mode actif
 * @param {'season' | 'today'} scope 
 */
async function fetchLeaderboard(scope) {
  hideError();

  if (CONFIG.useMock) {
    // Simulation d'un délai réseau de 150ms
    await new Promise((resolve) => setTimeout(resolve, 150));
    const data = MOCK_LEADERBOARD[scope];
    if (!data) {
      showError("INVALID_PARAM", `Période inconnue : ${scope}`);
      return null;
    }
    return data;
  }

  // Appel de l'API réelle
  try {
    const url = new URL(CONFIG.apiBaseUrl);
    url.searchParams.set("scope", scope);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    const payload = await response.json();

    if (!response.ok) {
      // Respect du schéma d'erreur du contrat : { error: { code, message } }
      const errCode = payload.error?.code || `HTTP_${response.status}`;
      const errText = payload.error?.message || "Une erreur est survenue lors du chargement";
      showError(errCode, errText);
      return null;
    }

    return payload; // Retourne le LeaderboardResponse validé
  } catch (err) {
    showError("NETWORK_ERROR", `Impossible de joindre le Backend (${CONFIG.apiBaseUrl}). Vérifiez que le serveur tourne.`);
    return null;
  }
}

/**
 * Rend les lignes du tableau dans le DOM
 * @param {Array} rows Liste des joueurs (LeaderboardRow[])
 */
function renderTable(rows) {
  tbody.innerHTML = "";

  // Cas limite prévu par le contrat : "tableau vide rows: [] déclenchant le message d'attente front"
  if (!rows || rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #64748b;">
          Aucun joueur classé pour cette période.
        </td>
      </tr>
    `;
    return;
  }

  rows.forEach((player) => {
    const tr = document.createElement("tr");

    // Règle du contrat : Top 3 avec style doré (calculé par le front avec rank <= 3)
    const isTop3Class = player.rank <= 3 ? "top-3" : "";

    // Règle du contrat : Équipe 'null' affichée avec un tiret "—"
    const teamDisplay = player.team !== null && player.team !== undefined && player.team !== "" 
      ? escapeHtml(player.team) 
      : "—";

    tr.innerHTML = `
      <td class="col-rank ${isTop3Class}">${player.rank}</td>
      <td class="col-player">${escapeHtml(player.pseudo)}</td>
      <td class="col-team">${teamDisplay}</td>
      <td class="col-level">${player.level}</td>
      <td class="col-xp">${player.xp}</td>
    `;

    tbody.appendChild(tr);
  });
}

/**
 * Met à jour l'affichage selon le scope sélectionné
 * @param {'season' | 'today'} scope 
 */
async function loadAndDisplay(scope) {
  currentScope = scope;

  // Mise à jour de l'apparence des onglets
  if (scope === "season") {
    tabSeason.classList.add("active");
    tabToday.classList.remove("active");
  } else {
    tabToday.classList.add("active");
    tabSeason.classList.remove("active");
  }

  const data = await fetchLeaderboard(scope);
  if (data && data.rows) {
    renderTable(data.rows);
  }
}

// --- GESTION DES ERREURS ---
function showError(code, message) {
  errorBanner.style.display = "block";
  errorMessage.textContent = `[${code}] ${message}`;
}

function hideError() {
  errorBanner.style.display = "none";
  errorMessage.textContent = "";
}

// Sécurité contre l'injection XSS pour les pseudos/équipes
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- ÉCOUTEURS D'ÉVÉNEMENTS ---
tabSeason.addEventListener("click", () => loadAndDisplay("season"));
tabToday.addEventListener("click", () => loadAndDisplay("today"));

// Bouton de bascule Mock / API Réelle (Idéal pour l'étape de 12h05 !)
btnToggleMode.addEventListener("click", () => {
  CONFIG.useMock = !CONFIG.useMock;
  if (CONFIG.useMock) {
    modeBadge.textContent = "Mode : Mock Front";
    modeBadge.className = "mode-badge badge-mock";
    btnToggleMode.textContent = "Passer sur l'API Réelle (Back)";
  } else {
    modeBadge.textContent = "Mode : API Réelle (Back)";
    modeBadge.className = "mode-badge badge-real";
    btnToggleMode.textContent = "Passer sur le Mock Front";
  }
  loadAndDisplay(currentScope);
});

// Chargement initial au démarrage
document.addEventListener("DOMContentLoaded", () => {
  loadAndDisplay("season");
});

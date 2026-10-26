# Écarts au branchement

Front servi sur http://localhost:5500, back sur http://localhost:3000.
Appel : `GET /api/leaderboard?scope=season|today`.

## CORS

La page et l'API ne sont pas sur la même origine. Le back répond 200, sans `Access-Control-Allow-Origin`. Le navigateur jette la réponse. Le front affiche `NETWORK_ERROR` et laisse les 11 lignes du mock à l'écran. Le serveur tourne.

- Contrat : rien sur l'origine, le port, ni CORS.
- Back : aucun en-tête CORS. Le contrat ne le demande pas.
- Front : autre port. L'URL appelée est celle du contrat.

Plusieurs. Le trou est dans le contrat. Ça casse des deux côtés : le back n'envoie pas l'en-tête, le front est sur une autre origine.

## JSON incomplet

`season` renvoie 3 lignes : Ishak (rang 1, 533 XP), Jérémy (rang 2, 496 XP), Dylan (rang 10, 0 XP). Le rang saute de 2 à 10.

`today` renvoie les mêmes lignes et les mêmes XP.

- Contrat : les règles disent tous les joueurs, des rangs continus (1, 2, 3…) et, pour `today`, les points du jour. L'exemple n'a que ces 3 lignes, avec un rang 10. Aucun jeu de données pour `today`.
- Back : a renvoyé l'exemple pour les deux scopes. Pas tous les joueurs, pas de points du jour.
- Front : l'affichage lit `rows` tel quel. Le mock, à côté, invente les 11 joueurs et un `today` différent. Il reste visible seulement parce que l'appel échoue.

Plusieurs. Le contrat se contredit (règles contre exemple). Le back a suivi l'exemple.

## Déjà aligné

L'URL, `scope`, les champs `rank`, `id`, `pseudo`, `team`, `level`, `xp`, `team: null`, et les erreurs `{ error: { code, message } }`.

Le 401 du contrat n'est implémenté ni au front ni au back. Il n'apparaît pas au branchement.

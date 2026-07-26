# Aegis Protect

Site bleu anti-raid **Aegis Protect** avec API pour connecter ton bot Discord existant.

## Structure

- `site/pages/` : pages HTML du site.
- `site/css/` : un CSS par page.
- `site/js/` : JavaScript du site.
- `site/data/stats.json` : stats affichees sur l'accueil.
- `site/data/blacklist.json` : blacklist geree par le bot.
- `server.js` : serveur local du site + API `/api/stats`.

## Lancer

1. Copier `.env.example` en `.env`
2. Changer `API_SECRET`
3. Ajouter `DISCORD_BOT_TOKEN` si tu veux utiliser `/api/send-message`
4. Lancer le site : `npm run site`

Le site sera disponible sur `http://localhost:3000`.

## Communication avec ton bot

La page d'accueil relit les stats toutes les 2 secondes via `/api/stats`.

Ton bot peut mettre a jour le site avec ces routes :

- `POST /api/stats` : remplace une ou plusieurs stats.
- `POST /api/blacklist/add` : ajoute un utilisateur blacklist.
- `POST /api/blacklist/remove` : retire un utilisateur blacklist.
- `POST /api/raid-blocked` : ajoute 1 raid bloque.
- `POST /api/send-message` : envoie un message Discord dans un salon.

Ajoute l'en-tete `Authorization: Bearer TON_API_SECRET` ou `x-api-key: TON_API_SECRET`.

Exemple dans ton bot :

```js
await fetch("http://localhost:3000/api/blacklist/add", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer change_moi"
  },
  body: JSON.stringify({
    userId: "123456789",
    reason: "Raid"
  })
});
```

Exemple pour envoyer un message Discord depuis le site :

```js
fetch("http://IP_DE_TON_SERVEUR:3000/api/send-message", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "CHANGE_MOI_CLE_SECRETE_LONGUE"
  },
  body: JSON.stringify({
    guildId: "ID_DU_SERVEUR",
    channelId: "ID_DU_SALON",
    content: "Message envoye depuis le site"
  })
})
  .then((res) => res.json())
  .then(console.log);
```

## Images

- `site/assets/aegis-logo.png` : PP/logo.
- `site/assets/aegis-banner.png` : banniere de la page d'accueil.

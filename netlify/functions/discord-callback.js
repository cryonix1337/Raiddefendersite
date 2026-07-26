const { cookie, decode, sessionCookie, clearOauthCookie } = require("./discord-auth");

function htmlError(message, status = 400) {
  return {
    statusCode: status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Erreur connexion</title>
<style>body{font-family:system-ui,sans-serif;background:#0b1220;color:#eef7ff;display:grid;place-items:center;min-height:100vh;margin:0}
.card{max-width:420px;padding:28px;border-radius:12px;background:#162033;border:1px solid #2a3b55;text-align:center}
a{color:#4de1ff}</style></head><body><div class="card"><h1>Connexion Discord</h1><p>${message}</p>
<p><a href="/site/pages/index.html">Retour à l'accueil</a> · <a href="/.netlify/functions/discord-login">Réessayer</a></p></div></body></html>`,
  };
}

exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  const expected = cookie(event, "rd_oauth");

  // Discord peut renvoyer une erreur OAuth
  if (query.error) {
    return htmlError(`Discord a refusé : ${query.error_description || query.error}`);
  }

  if (!query.code || !query.state) {
    return htmlError("Paramètres OAuth manquants (code / state). Relance la connexion.");
  }

  if (!expected || query.state !== expected || !decode(query.state)) {
    return htmlError(
      "Session OAuth expirée ou cookie manquant. Autorise les cookies pour ce site, puis réessaie."
    );
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return htmlError("Variables Discord manquantes sur Netlify (CLIENT_ID / SECRET / REDIRECT_URI).", 503);
  }

  try {
    const form = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code: query.code,
      redirect_uri: redirectUri,
    });

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("token error", tokens);
      throw new Error(tokens.error_description || tokens.error || "token_error");
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const user = await userResponse.json();
    if (!userResponse.ok) throw new Error("profile_error");

    const guildResponse = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const guilds = guildResponse.ok ? await guildResponse.json() : [];

    const administratorGuilds = guilds.filter(
      (guild) => guild.owner || (BigInt(guild.permissions) & 0x8n) === 0x8n
    );

    let botGuilds = [];
    if (process.env.DISCORD_BOT_TOKEN) {
      botGuilds = (
        await Promise.all(
          administratorGuilds.map(async (guild) => {
            try {
              const membership = await fetch(`https://discord.com/api/v10/guilds/${guild.id}`, {
                headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
              });
              return membership.ok
                ? { id: guild.id, name: guild.name, icon: guild.icon }
                : null;
            } catch {
              return null;
            }
          })
        )
      ).filter(Boolean);
    } else {
      // Sans bot token : on montre quand même les serveurs admin
      botGuilds = administratorGuilds.map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
      }));
    }

    const profile = {
      id: user.id,
      username: user.global_name || user.username,
      avatar: user.avatar,
      guilds: botGuilds,
    };

    // Chemin cohérent avec ta structure (root → site/pages/...)
    const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");
    const dashboardPath = "/site/pages/dashboard.html";
    const location = appUrl ? `${appUrl}${dashboardPath}` : dashboardPath;

    // ✅ CORRECTION ICI : Utilisation de multiValueHeaders pour le tableau de cookies
    return {
      statusCode: 302,
      headers: {
        Location: location,
        "Cache-Control": "no-store",
      },
      multiValueHeaders: {
        "Set-Cookie": [sessionCookie(profile), clearOauthCookie()],
      },
      body: "",
    };
  } catch (error) {
    console.error("discord-callback:", error.message || error);
    return htmlError(
      `Impossible de finaliser la connexion : ${error.message || "erreur inconnue"}. Vérifie CLIENT_SECRET et REDIRECT_URI.`,
      502
    );
  }
};

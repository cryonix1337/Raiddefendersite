const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

require("dotenv").config();

const TEAM_FILE = path.join(__dirname, "site", "data", "team.json");

const app = express();
const port = Number(process.env.PORT || 3000);
const appUrl = (process.env.APP_URL || `http://localhost:${port}`).replace(/\/$/, "");
// Cookies Secure cassent la session sur http://localhost
const isLocal =
  /localhost|127\.0\.0\.1/.test(appUrl) ||
  /localhost|127\.0\.0\.1/.test(process.env.DISCORD_REDIRECT_URI || "") ||
  process.env.NODE_ENV !== "production";
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const plans = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  quarterly: process.env.STRIPE_PRICE_QUARTERLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
};

// ── Discord OAuth helpers ──────────────────────────────────────────
function secret() {
  return process.env.DISCORD_SESSION_SECRET || process.env.DISCORD_CLIENT_SECRET || "dev-secret-change-me";
}
function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}
function encode(value) {
  const data = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${data}.${sign(data)}`;
}
function decode(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;
    const expected = sign(data);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const value = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (!value || typeof value.expiresAt !== "number") return null;
    return value.expiresAt > Date.now() ? value : null;
  } catch {
    return null;
  }
}
function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  return raw
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
function cookieFlags() {
  // Jamais Secure en local (sinon le navigateur refuse le cookie en http://)
  const local =
    isLocal ||
    /localhost|127\.0\.0\.1/.test(process.env.DISCORD_REDIRECT_URI || "");
  return local
    ? "Path=/; HttpOnly; SameSite=Lax"
    : "Path=/; HttpOnly; Secure; SameSite=Lax";
}
function sessionCookie(user) {
  const token = encode({ user, expiresAt: Date.now() + 604800000 });
  return `rd_session=${token}; ${cookieFlags()}; Max-Age=604800`;
}
function oauthCookie(state) {
  return `rd_oauth=${state}; ${cookieFlags()}; Max-Age=600`;
}
function clearOauthCookie() {
  return `rd_oauth=; ${cookieFlags()}; Max-Age=0`;
}

// Redirect URI locale par défaut (à ajouter aussi dans le Developer Portal Discord)
const discordRedirectUri =
  process.env.DISCORD_REDIRECT_URI ||
  `${appUrl}/.netlify/functions/discord-callback`;

// ── Dashboard config ───────────────────────────────────────────────
const dashboardConfigPath = path.join(__dirname, "site", "data", "dashboard-config.json");
const defaultDashboardConfig = {
  guild: { id: "118932456789012345", name: "RaidDefender", members: 2847 },
  general: { enabled: true, alertChannel: "securite-alertes", logChannel: "logs-RaidDefender" },
  thresholds: { joinsPerMinute: 12, mentionsPerMessage: 5, messagesPerTenSeconds: 8, accountAgeDays: 7 },
  modules: {},
};
function dashboardConfig() {
  try {
    return { ...defaultDashboardConfig, ...JSON.parse(fs.readFileSync(dashboardConfigPath, "utf8")) };
  } catch {
    return defaultDashboardConfig;
  }
}

// ── Stripe webhook (raw body) ──────────────────────────────────────
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).send("Stripe webhook non configuré");
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Webhook invalide : ${error.message}`);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const discordId = session.metadata?.discord_id;
    console.log(`Nouvel abonnement : Discord ${discordId}, session ${session.id}`);
    if (process.env.DISCORD_PAYMENT_WEBHOOK_URL) {
      await fetch(process.env.DISCORD_PAYMENT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `🛒 **Nouvel abonnement Premium**\nID Discord : **${discordId}**\nSession : \`${session.id}\``,
        }),
      }).catch((error) => console.error("Notification Discord impossible :", error.message));
    }
  } else if (event.type === "invoice.paid") {
    console.log(`Renouvellement réglé : ${event.data.object.subscription}`);
  } else if (event.type === "customer.subscription.deleted") {
    console.log(`Abonnement annulé : ${event.data.object.id}`);
  }
  res.sendStatus(200);
});

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", appUrl].filter(Boolean),
    credentials: true,
  })
);

// Fichiers statiques : site/ à la racine + racine du projet
app.use(express.static(path.join(__dirname, "site")));
app.use(express.static(__dirname));

// ── Discord OAuth (mêmes chemins que Netlify pour le front) ────────
app.get(["/.netlify/functions/discord-login", "/api/discord-login"], (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return res
      .status(503)
      .type("html")
      .send(
        `<h1>Connexion Discord non configurée</h1><p>Ajoute <code>DISCORD_CLIENT_ID</code> dans le fichier <code>.env</code>.</p>`
      );
  }

  const state = encode({
    nonce: crypto.randomBytes(18).toString("base64url"),
    expiresAt: Date.now() + 600000,
  });

  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: discordRedirectUri,
    response_type: "code",
    scope: "identify guilds",
    state,
    prompt: "consent",
  });

  res.append("Set-Cookie", oauthCookie(state));
  res.setHeader("Cache-Control", "no-store");
  res.redirect(302, `https://discord.com/oauth2/authorize?${query}`);
});

app.get(["/.netlify/functions/discord-callback", "/api/discord-callback"], async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const expected = readCookie(req, "rd_oauth");
  console.log("[callback] code=", !!code, "state=", !!state, "cookie_oauth=", !!expected, "error=", error || "none");

  const fail = (msg) =>
    res.status(400).type("html").send(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Erreur</title>
<style>body{font-family:system-ui;background:#0b1220;color:#eef7ff;display:grid;place-items:center;min-height:100vh;margin:0}
.card{max-width:440px;padding:28px;border-radius:12px;background:#162033;border:1px solid #2a3b55;text-align:center}
a{color:#4de1ff}</style></head><body><div class="card"><h1>Connexion Discord</h1><p>${msg}</p>
<p><a href="/pages/index.html">Accueil</a> · <a href="/.netlify/functions/discord-login">Réessayer</a></p></div></body></html>`);

  if (error) return fail(`Discord a refusé : ${error_description || error}`);
  if (!code || !state) return fail("Paramètres OAuth manquants. Relance la connexion.");
  if (!expected || state !== expected || !decode(state)) {
    return fail("Session OAuth expirée ou cookie manquant. Réessaie.");
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return fail("DISCORD_CLIENT_ID ou DISCORD_CLIENT_SECRET manquant dans .env");
  }

  try {
    const form = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: discordRedirectUri,
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

    // Fabrication automatique de l'URL de l'avatar
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${Number(user.id) % 5}.png`;

    // Mise à jour automatique de team.json si l'utilisateur est dans l'équipe
    try {
      if (fs.existsSync(TEAM_FILE)) {
        let members = JSON.parse(fs.readFileSync(TEAM_FILE, "utf8"));
        let memberIndex = members.findIndex(m => m.id === user.id);
        
        if (memberIndex !== -1) {
          members[memberIndex].username = user.global_name || user.username;
          members[memberIndex].avatar = avatarUrl;
          members[memberIndex].updatedAt = new Date().toISOString();
          
          fs.writeFileSync(TEAM_FILE, JSON.stringify(members, null, 2));
          console.log(`[TEAM AUTO-SYNC] Avatar mis à jour pour ${members[memberIndex].username}`);
        }
      }
    } catch (err) {
      console.error("Erreur lors de la synchro auto de l'avatar :", err);
    }

    const guildResponse = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const guilds = guildResponse.ok ? await guildResponse.json() : [];
    const administratorGuilds = guilds.filter(
      (g) => g.owner || (BigInt(g.permissions) & 0x8n) === 0x8n
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
      botGuilds = administratorGuilds.map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
      }));
    }

    const profile = {
      id: user.id,
      username: user.global_name || user.username,
      avatar: avatarUrl,
      guilds: botGuilds,
    };

    res.append("Set-Cookie", sessionCookie(profile));
    res.append("Set-Cookie", clearOauthCookie());
    res.setHeader("Cache-Control", "no-store");
    console.log("Connexion OK:", profile.username, "| guildes:", profile.guilds.length);
    res.redirect(302, "/pages/dashboard.html");
  } catch (err) {
    console.error("discord-callback:", err.message || err);
    return fail(`Impossible de finaliser : ${err.message || "erreur"}. Vérifie CLIENT_SECRET et REDIRECT_URI.`);
  }
});

app.get(["/.netlify/functions/discord-me", "/api/discord-me"], (req, res) => {
  const session = decode(readCookie(req, "rd_session"));
  res.setHeader("Cache-Control", "no-store");
  if (!session?.user) {
    return res.status(401).json({ error: "Non connecté" });
  }
  res.json(session.user);
});

app.get(["/.netlify/functions/discord-logout", "/api/discord-logout"], (req, res) => {
  const flags = cookieFlags();
  res.append("Set-Cookie", `rd_session=; ${flags}; Max-Age=0`);
  res.append("Set-Cookie", `rd_oauth=; ${flags}; Max-Age=0`);
  res.setHeader("Cache-Control", "no-store");
  const redirectTo = req.query.redirect || "/pages/index.html";
  res.redirect(302, redirectTo);
});

// ── API dashboard / stats ──────────────────────────────────────────
app.get("/api/dashboard-config", (req, res) => res.json(dashboardConfig()));
app.post("/api/dashboard-config", (req, res) => {
  const previous = dashboardConfig();
  const next = {
    ...previous,
    ...req.body,
    guild: { ...previous.guild, ...(req.body.guild || {}) },
    general: { ...previous.general, ...(req.body.general || {}) },
    thresholds: { ...previous.thresholds, ...(req.body.thresholds || {}) },
    modules: { ...previous.modules, ...(req.body.modules || {}) },
  };
  fs.writeFileSync(dashboardConfigPath, `${JSON.stringify(next, null, 2)}\n`);
  res.json(next);
});

app.post("/api/create-checkout-session", async (req, res) => {
  const { plan, discordId } = req.body || {};
  if (!plans[plan] || !/^\d{17,20}$/.test(String(discordId || ""))) {
    return res.status(400).json({ error: "Offre ou identifiant Discord invalide." });
  }
  if (!stripe) return res.status(503).json({ error: "Stripe n'est pas configuré sur le serveur." });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plans[plan], quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      client_reference_id: String(discordId),
      metadata: { discord_id: String(discordId), plan },
      subscription_data: { metadata: { discord_id: String(discordId), plan } },
      success_url: `${appUrl}/pages/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pages/premium.html?cancelled=1`,
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error("Erreur Stripe :", error.message);
    res.status(500).json({ error: "Impossible de créer la session de paiement." });
  }
});

// =====================================================
// API TEAM
// =====================================================

app.get("/api/team", (req, res) => {
    try {
        if (!fs.existsSync(TEAM_FILE)) {
            return res.json([]);
        }
        const members = JSON.parse(
            fs.readFileSync(TEAM_FILE, "utf8")
        );
        res.json(members);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Impossible de charger team.json"
        });
    }
});

app.post("/api/update-profile", (req, res) => {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${process.env.API_SECRET || "CLE_SECRETE_DASHBOARD"}`) {
        return res.status(401).json({
            success: false,
            message: "Non autorisé"
        });
    }

    const {
        discordId,
        username,
        avatarUrl
    } = req.body;

    try {
        if (!fs.existsSync(TEAM_FILE)) {
            return res.status(404).json({
                success: false,
                message: "team.json introuvable"
            });
        }

        const members = JSON.parse(
            fs.readFileSync(TEAM_FILE, "utf8")
        );

        const member = members.find(
            m => m.id === discordId
        );

        if (!member) {
            return res.json({
                success: false,
                message: "Utilisateur non trouvé."
            });
        }

        member.username = username;
        member.avatar = avatarUrl;
        member.updatedAt = new Date().toISOString();

        fs.writeFileSync(
            TEAM_FILE,
            JSON.stringify(
                members,
                null,
                2
            )
        );

        console.log(
            `[TEAM] ${username} synchronisé.`
        );

        res.json({
            success: true
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "site", "pages", "index.html")));

app.listen(port, () => {
  console.log("");
  console.log("  RaidDefender — serveur local");
  console.log(`  Site     : ${appUrl}`);
  console.log(`  Accueil   : ${appUrl}/pages/index.html`);
  console.log(`  Dashboard : ${appUrl}/pages/dashboard.html`);
  console.log(`  Login     : ${appUrl}/.netlify/functions/discord-login`);
  console.log(`  Redirect  : ${discordRedirectUri}`);
  if (!process.env.DISCORD_CLIENT_ID) {
    console.log("");
    console.log("  ⚠  DISCORD_CLIENT_ID manquant dans .env");
  }
  if (!process.env.DISCORD_CLIENT_SECRET) {
    console.log("  ⚠  DISCORD_CLIENT_SECRET manquant dans .env");
  }
  console.log("");
});

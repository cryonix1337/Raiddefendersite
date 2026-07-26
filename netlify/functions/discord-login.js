const crypto = require("crypto");
const { encode, oauthCookie } = require("./discord-auth");

exports.handler = async () => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: "Connexion Discord non configurée. Vérifie DISCORD_CLIENT_ID et DISCORD_REDIRECT_URI sur Netlify.",
    };
  }

  const state = encode({
    nonce: crypto.randomBytes(18).toString("base64url"),
    expiresAt: Date.now() + 600000,
  });

  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds",
    state,
    prompt: "consent",
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://discord.com/oauth2/authorize?${query}`,
      "Set-Cookie": oauthCookie(state),
      "Cache-Control": "no-store",
    },
    body: "",
  };
};

const crypto = require("crypto");

function secret() {
  return process.env.DISCORD_SESSION_SECRET || process.env.DISCORD_CLIENT_SECRET || "fallback-dev-secret";
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
    // timingSafeEqual throws if lengths differ
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const value = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (!value || typeof value.expiresAt !== "number") return null;
    return value.expiresAt > Date.now() ? value : null;
  } catch {
    return null;
  }
}

function cookie(event, name) {
  const raw =
    event.headers?.cookie ||
    event.headers?.Cookie ||
    event.multiValueHeaders?.cookie?.[0] ||
    event.multiValueHeaders?.Cookie?.[0] ||
    "";
  return raw
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function sessionCookie(user) {
  const token = encode({ user, expiresAt: Date.now() + 604800000 });
  // Secure uniquement en prod HTTPS ; SameSite=Lax pour le retour OAuth
  return `rd_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`;
}

function oauthCookie(state) {
  return `rd_oauth=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}

function clearOauthCookie() {
  return "rd_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

module.exports = {
  encode,
  decode,
  cookie,
  sessionCookie,
  oauthCookie,
  clearOauthCookie,
};

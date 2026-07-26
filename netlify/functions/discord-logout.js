const { cookie } = require("./discord-auth");

exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  const redirectTo = query.redirect || "/site/pages/index.html";
  
  return {
    statusCode: 302,
    headers: {
      Location: redirectTo,
      "Cache-Control": "no-store",
    },
    // ✅ Utilisation de multiValueHeaders pour le tableau de cookies
    multiValueHeaders: {
      "Set-Cookie": [
        "rd_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        "rd_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      ],
    },
    body: "",
  };
};

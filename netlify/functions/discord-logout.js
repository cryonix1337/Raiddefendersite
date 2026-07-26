exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  
  // Redirection propre vers la page d'accueil par défaut
  const redirectTo = query.redirect || "/site/pages/index.html";

  return {
    statusCode: 302,
    headers: {
      "Location": redirectTo,
      "Cache-Control": "no-store",
    },
    // Utilisation de multiValueHeaders pour gérer proprement plusieurs cookies Set-Cookie
    multiValueHeaders: {
      "Set-Cookie": [
        "rd_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        "rd_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
      ]
    },
    body: "",
  };
};

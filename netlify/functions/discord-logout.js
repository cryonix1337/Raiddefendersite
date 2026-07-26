exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  
  // Utilise le chemin relatif sécurisé par défaut
  const redirectTo = query.redirect || "/site/pages/index.html";

  return {
    statusCode: 302,
    headers: {
      Location: redirectTo,
      "Cache-Control": "no-store",
    },
    // Syntaxe acceptée par les fonctions Netlify pour supprimer plusieurs cookies
    multiValueHeaders: {
      "Set-Cookie": [
        "rd_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        "rd_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
      ]
    },
    body: "",
  };
};

exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  
  // Si un paramètre de redirection est fourni, on l'utilise, 
  // sinon on redirige vers votre page d'accueil par défaut
  const redirectTo = query.redirect || "/site/pages/index.html";

  return {
    statusCode: 302,
    headers: {
      Location: redirectTo,
      "Cache-Control": "no-store",
    },
    // Syntaxe de Netlify pour supprimer proprement les cookies multiples
    cookies: [
      "rd_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      "rd_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    ],
    body: "",
  };
};

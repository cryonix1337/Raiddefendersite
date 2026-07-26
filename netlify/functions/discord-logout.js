exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  
  // Utilisation de la racine du site pour éviter le 404
  const redirectTo = query.redirect || "/index.html"; 

  return {
    statusCode: 302,
    headers: {
      Location: redirectTo,
      "Cache-Control": "no-store",
    },
    // ✅ La syntaxe correcte exigée par Netlify pour supprimer plusieurs cookies
    cookies: [
      "rd_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      "rd_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    ],
    body: "",
  };
};

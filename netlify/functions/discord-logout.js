exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  
  // Récupération propre de l'URL de base sans doubler les variables
  const rawAppUrl = process.env.APP_URL || 'https://raiddefender.netlify.app';
  const baseUrl = rawAppUrl.startsWith('APP_URL=') ? rawAppUrl.replace('APP_URL=', '') : rawAppUrl;

  // Chemin de redirection par défaut vers votre page d'accueil
  const redirectTo = query.redirect || `${baseUrl}/site/pages/index.html`;

  return {
    statusCode: 302,
    headers: {
      Location: redirectTo,
      "Cache-Control": "no-store",
    },
    // Utilisation du format de cookies natif de Netlify pour éviter l'erreur Lambda
    cookies: [
      "rd_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      "rd_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    ],
    body: "",
  };
};

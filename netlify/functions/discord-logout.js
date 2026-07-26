const { cookie } = require("./discord-auth");

exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  
  // Utilisation d'un chemin relatif propre pour éviter le 404
  const redirectTo = query.redirect || "/index.html"; 

  return {
    statusCode: 302,
    headers: {
      Location: redirectTo,
      "Cache-Control": "no-store",
    },
    // ✅ Le nouveau standard Netlify pour plusieurs cookies :
    cookies: [
      "rd_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      "rd_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    ],
    body: "",
  };
};

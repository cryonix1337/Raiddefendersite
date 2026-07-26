const { cookie, decode } = require("./discord-auth");

exports.handler = async (event) => {
  const session = decode(cookie(event, "rd_session"));

  if (!session?.user) {
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({ error: "Non connecté" }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(session.user),
  };
};

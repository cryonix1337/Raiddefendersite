exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  const redirectTo = query.redirect || "/pages/index.html";

  return {
    statusCode: 302,
    headers: {
      Location: redirectTo,
      "Cache-Control": "no-store",
    },
    multiValueHeaders: {
      "Set-Cookie": [
        "rd_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        "rd_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
      ]
    },
    body: "",
  };
};

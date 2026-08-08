exports.handler = async function () {
  const botUrl = process.env.BOT_STATUS_URL;
  const apiKey = process.env.BOT_STATUS_API_KEY;

  let bot = {
    status: "unknown",
    latency: null
  };

  try {
    const response = await fetch(botUrl, {
      headers: {
        "x-api-key": apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();

      bot = {
        status: data.status || "operational",
        latency: data.latency ?? null
      };
    } else {
      bot.status = "outage";
    }
  } catch {
    bot.status = "outage";
  }

  const operational = bot.status === "operational";

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    },
    body: JSON.stringify({
      status: operational ? "operational" : "degraded",
      services: {
        bot: bot.status,
        gateway: bot.status,
        api: "operational",
        dashboard: "operational",
        website: "operational"
      },
      latency: bot.latency,
      updatedAt: new Date().toISOString()
    })
  };
};

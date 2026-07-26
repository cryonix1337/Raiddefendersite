const defaultStats = {
  blacklistTotal: 124,
  raidsBlocked: 37,
  serversProtected: 12
};

const statsNodes = {
  blacklistTotal: document.querySelector("#blacklistTotal"),
  raidsBlocked: document.querySelector("#raidsBlocked"),
  serversProtected: document.querySelector("#serversProtected")
};

function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function renderStats(stats) {
  statsNodes.blacklistTotal.textContent = formatNumber(stats.blacklistTotal);
  statsNodes.raidsBlocked.textContent = formatNumber(stats.raidsBlocked);
  statsNodes.serversProtected.textContent = formatNumber(stats.serversProtected);
}

// Version améliorée et plus silencieuse
async function loadStats() {
  // 1. Essayer l'API
  try {
    const response = await fetch("/api/stats", { 
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    });
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Stats chargées depuis l'API");
      return { ...defaultStats, ...data };
    }
  } catch (e) {}

  // 2. Fallback sur le fichier JSON
  try {
    const response = await fetch("../data/stats.json", { 
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    });
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Stats chargées depuis ../data/stats.json");
      return { ...defaultStats, ...data };
    }
  } catch (e) {}

  // 3. Stats par défaut
  console.warn("⚠️ Utilisation des statistiques par défaut");
  return defaultStats;
}

loadStats().then((stats) => {
  renderStats(stats);
  setInterval(async () => {
    const freshStats = await loadStats();
    stats.blacklistTotal = freshStats.blacklistTotal;
    stats.raidsBlocked = freshStats.raidsBlocked;
    stats.serversProtected = freshStats.serversProtected;
    renderStats(stats);
  }, 2000);
});
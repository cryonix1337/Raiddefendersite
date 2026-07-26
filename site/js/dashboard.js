// 1. Liste des modules
const modules = [
  ["antiban", "Anti-ban", "Bloque les bannissements abusifs", "Anti-ban", "Blocks abusive bans", "♜"],
  ["antibot", "Anti-bot", "Détecte les ajouts de bots", "Anti-bot", "Detects bot additions", "◉"],
  ["antighostping", "Anti-ghostping", "Journalise les pings supprimés", "Anti-ghostping", "Logs deleted pings", "◌"],
  ["antikick", "Anti-kick", "Empêche les expulsions abusives", "Anti-kick", "Prevents abusive kicks", "↗"],
  ["antilink", "Anti-link", "Filtre les liens non autorisés", "Anti-link", "Filters unauthorized links", "⌁"],
  ["antiinvite", "Anti-invite", "Bloque les invitations Discord", "Anti-invite", "Blocks Discord invites", "✦"],
  ["antispam", "Anti-spam", "Limite les messages répétés", "Anti-spam", "Limits repeated messages", "≋"],
  ["antitoken", "Anti-token", "Détecte les tokens exposés", "Anti-token", "Detects exposed tokens", "◈"],
  ["captcha", "Captcha", "Vérifie les nouveaux membres", "Captcha", "Verifies new members", "✓"],
  ["ban", "Historique des bans", "Conserve les sanctions", "Ban history", "Stores sanctions", "⊘"],
  ["clear", "Clear", "Nettoyage contrôlé des messages", "Clear", "Controlled message purging", "▤"],
  ["kick", "Kick", "Expulsions encadrées", "Kick", "Regulated expulsions", "⇥"],
  ["mute", "Mute", "Restrictions temporaires", "Mute", "Temporary restrictions", "◐"],
  ["purge", "Purge", "Suppression en masse sécurisée", "Purge", "Secure bulk deletion", "▥"],
  ["raidmode", "Mode raid", "Réponse renforcée aux raids", "Raid mode", "Reinforced raid response", "◉"],
  ["unban", "Unban", "Traçabilité des débannissements", "Unban", "Unban traceability", "↶"],
  ["unmute", "Unmute", "Fin de restriction tracée", "Unmute", "Traced restriction removal", "◑"],
  ["warn", "Avertissements", "Suivi des avertissements", "Warnings", "Warning tracking", "!"]
];

let config;
const $ = (selector) => document.querySelector(selector);

// 2. Dictionnaire des traductions UI
const i18n = {
  fr: {
    guildHint: "Serveurs où tu es admin",
    navOverview: "Vue d’ensemble",
    navProtections: "Protections",
    navModeration: "Modération",
    navSettings: "Paramètres",
    welcome: "Bonjour,",
    backToSite: "↗ Retour au site",
    breadcrumbDashboard: "Dashboard",
    breadcrumbOverview: "Vue d’ensemble",
    statusLabel: "État de la protection",
    statusTitleActive: "RaidDefender est actif",
    statusTitleDisabled: "RaidDefender est désactivé",
    statusDescPrefix: "La protection de ",
    statusDescSuffix: " fonctionne normalement.",
    statusDescDisabledSuffix: " est actuellement en pause.",
    uptime: "● 99,98 % de disponibilité",
    masterEnabled: "Activé",
    masterDisabled: "Désactivé",
    protectedMembers: "Membres protégés",
    subProtected: "+12 cette semaine",
    blockedActions: "Actions bloquées",
    subBlocked: "↗ +18 % ce mois",
    alertsToday: "Alertes aujourd’hui",
    subAlerts: "Dernière il y a 18 min",
    activeModules: "Modules actifs",
    subModules: "Configuration à jour",
    hoursLabel: "Dernières 24 heures",
    titleActivity: "Activité de sécurité",
    btnLogs: "Voir les logs →",
    configLabel: "Configuration",
    titleModules: "Modules de protection",
    enableAll: "Tout activer",
    disableAll: "Tout désactiver",
    descModules: "Activez uniquement les protections adaptées à votre communauté. Chaque changement est sauvegardé automatiquement.",
    settingsSecLabel: "Réglages généraux",
    titleSettings: "Canaux et détection",
    btnSave: "Enregistrer",
    lblAlertChan: "Salon d’alertes",
    lblLogChan: "Salon de logs",
    lblJoins: "Arrivées / minute",
    lblMentions: "Mentions / message",
    lblMessages: "Messages / 10 sec.",
    lblAge: "Âge minimal du compte (jours)",
    liveSecLabel: "En direct",
    titleEvents: "Événements récents",
    evt1Title: "Lien externe supprimé",
    evt1Sub: "#général · il y a 18 min",
    evt2Title: "Raid suspect détecté",
    evt2Sub: "3 arrivées groupées · il y a 46 min",
    evt3Title: "Captcha validé",
    evt3Sub: "Nouvel arrivant · il y a 1 h",
    savedLocal: "Sauvegardé localement — API indisponible",
    savedSuccess: "Configuration enregistrée",
    protEnabled: "Protection activée",
    protDisabled: "Protection désactivée",
    allActive: "Tous les modules sont actifs",
    allDisabled: "Tous les modules sont désactivés"
  },
  en: {
    guildHint: "Servers where you are admin",
    navOverview: "Overview",
    navProtections: "Protections",
    navModeration: "Moderation",
    navSettings: "Settings",
    welcome: "Hello,",
    backToSite: "↗ Back to site",
    breadcrumbDashboard: "Dashboard",
    breadcrumbOverview: "Overview",
    statusLabel: "Protection status",
    statusTitleActive: "RaidDefender is active",
    statusTitleDisabled: "RaidDefender is disabled",
    statusDescPrefix: "Protection for ",
    statusDescSuffix: " is operating normally.",
    statusDescDisabledSuffix: " is currently paused.",
    uptime: "● 99.98% uptime",
    masterEnabled: "Enabled",
    masterDisabled: "Disabled",
    protectedMembers: "Protected members",
    subProtected: "+12 this week",
    blockedActions: "Blocked actions",
    subBlocked: "↗ +18% this month",
    alertsToday: "Alerts today",
    subAlerts: "Last one 18 min ago",
    activeModules: "Active modules",
    subModules: "Configuration up to date",
    hoursLabel: "Last 24 hours",
    titleActivity: "Security activity",
    btnLogs: "View logs →",
    configLabel: "Configuration",
    titleModules: "Protection modules",
    enableAll: "Enable all",
    disableAll: "Disable all",
    descModules: "Only enable protections suited for your community. Changes are saved automatically.",
    settingsSecLabel: "General settings",
    titleSettings: "Channels and detection",
    btnSave: "Save",
    lblAlertChan: "Alert channel",
    lblLogChan: "Log channel",
    lblJoins: "Joins / minute",
    lblMentions: "Mentions / message",
    lblMessages: "Messages / 10 sec.",
    lblAge: "Minimum account age (days)",
    liveSecLabel: "Live",
    titleEvents: "Recent events",
    evt1Title: "External link removed",
    evt1Sub: "#general · 18 min ago",
    evt2Title: "Suspect raid detected",
    evt2Sub: "3 grouped joins · 46 min ago",
    evt3Title: "Captcha validated",
    evt3Sub: "New member · 1 hour ago",
    savedLocal: "Saved locally — API unavailable",
    savedSuccess: "Configuration saved",
    protEnabled: "Protection enabled",
    protDisabled: "Protection disabled",
    allActive: "All modules are active",
    allDisabled: "All modules are disabled"
  }
};

function getCurrentLang() {
  return localStorage.getItem("raiddefender_lang") || "fr";
}

function toast(message) {
  const node = $("#toast");
  if (!node) return;
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2600);
}

function countActive() {
  return Object.values(config.modules).filter(Boolean).length;
}

// 3. Rendu dynamique des modules selon la langue
function renderModules() {
  const lang = getCurrentLang();
  $("#moduleGrid").innerHTML = modules.map(([key, nameFr, descFr, nameEn, descEn, icon]) => {
    const name = lang === "en" ? nameEn : nameFr;
    const description = lang === "en" ? descEn : descFr;
    return `<label class="module">
      <span class="module-icon">${icon}</span>
      <div><strong>${name}</strong><small>${description}</small></div>
      <input type="checkbox" data-module="${key}" ${config.modules[key] ? "checked" : ""}>
      <span class="switch"></span>
    </label>`;
  }).join("");

  $("#moduleTotal").textContent = `${countActive()} / ${modules.length}`;
}

// 4. Fonction globale de changement de langue
function changeLanguage(lang) {
  const t = i18n[lang];
  if (!t) return;

  document.documentElement.lang = lang;
  localStorage.setItem("raiddefender_lang", lang);

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText("guildHint", t.guildHint);
  setText("breadcrumbCurrent", t.breadcrumbOverview);
  setText("uptimeText", t.uptime);
  setText("labelProtected", t.protectedMembers);
  setText("subProtected", t.subProtected);
  setText("labelBlocked", t.blockedActions);
  setText("subBlocked", t.subBlocked);
  setText("labelAlerts", t.alertsToday);
  setText("subAlerts", t.subAlerts);
  setText("labelModules", t.activeModules);
  setText("subModules", t.subModules);
  setText("labelHours", t.hoursLabel);
  setText("titleActivity", t.titleActivity);
  setText("btnLogs", t.btnLogs);
  setText("labelConfig", t.configLabel);
  setText("titleModules", t.titleModules);
  setText("enableAll", t.enableAll);
  setText("disableAll", t.disableAll);
  setText("descModules", t.descModules);
  setText("labelSettingsSec", t.settingsSecLabel);
  setText("titleSettings", t.titleSettings);
  setText("btnSave", t.btnSave);
  setText("labelLiveSec", t.liveSecLabel);
  setText("titleEvents", t.titleEvents);
  setText("evt1Title", t.evt1Title);
  setText("evt1Sub", t.evt1Sub);
  setText("evt2Title", t.evt2Title);
  setText("evt2Sub", t.evt2Sub);
  setText("evt3Title", t.evt3Title);
  setText("evt3Sub", t.evt3Sub);
  setText("backToSiteLink", t.backToSite);

  // Navigation
  const navOverview = $("#navOverview");
  if (navOverview) navOverview.innerHTML = `<span>▦</span> ${t.navOverview}`;
  const navProtections = $("#navProtections");
  if (navProtections) navProtections.innerHTML = `<span>◈</span> ${t.navProtections}`;
  const navModeration = $("#navModeration");
  if (navModeration) navModeration.innerHTML = `<span>◉</span> ${t.navModeration}`;
  const navSettings = $("#navSettings");
  if (navSettings) navSettings.innerHTML = `<span>⚙</span> ${t.navSettings}`;

  // État ON/OFF
  const isEnabled = config ? config.general.enabled : true;
  setText("statusTitle", isEnabled ? t.statusTitleActive : t.statusTitleDisabled);
  setText("masterText", isEnabled ? t.masterEnabled : t.masterDisabled);

  // Status Guild text
  const statusDesc = $("#statusDesc");
  if (statusDesc && config) {
    const guildName = config.guild.name;
    statusDesc.innerHTML = `${t.statusDescPrefix}<strong>${guildName}</strong>${isEnabled ? t.statusDescSuffix : t.statusDescDisabledSuffix}`;
  }

  // Form labels
  const updateLabel = (id, text) => {
    const lbl = document.getElementById(id);
    if (lbl && lbl.childNodes.length > 0) lbl.childNodes[0].nodeValue = text;
  };
  updateLabel("lblAlertChan", t.lblAlertChan);
  updateLabel("lblLogChan", t.lblLogChan);
  updateLabel("lblJoins", t.lblJoins);
  updateLabel("lblMentions", t.lblMentions);
  updateLabel("lblMessages", t.lblMessages);
  updateLabel("lblAge", t.lblAge);

  // Re-render des modules
  if (config) renderModules();
}

// 5. Remplissage des données initiales
function populate() {
  const lang = getCurrentLang();
  const locale = lang === "en" ? "en-US" : "fr-FR";

  $("#guildName").textContent = config.guild.name;
  $("#memberCount").textContent = new Intl.NumberFormat(locale).format(config.guild.members);
  $("#masterSwitch").checked = config.general.enabled;

  const form = $("#settingsForm");
  Object.entries({ ...config.general, ...config.thresholds }).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });

  changeLanguage(lang);
}

// 6. Sauvegarde API / LocalStorage
async function save(messageKey) {
  const lang = getCurrentLang();
  const defaultMsg = messageKey ? i18n[lang][messageKey] : i18n[lang].savedSuccess;

  try {
    const res = await fetch("/api/dashboard-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error();
    config = await res.json();
    toast(defaultMsg);
  } catch {
    localStorage.setItem("raidDefender-dashboard-config", JSON.stringify(config));
    toast(i18n[lang].savedLocal);
  }
}

// 7. Chargement de la configuration
async function load() {
  try {
    const res = await fetch("/api/dashboard-config", { cache: "no-store" });
    if (!res.ok) throw new Error();
    config = await res.json();
  } catch {
    config = JSON.parse(localStorage.getItem("raidDefender-dashboard-config")) || {
      guild: { name: "RaidDefender • Staff", members: 2847 },
      general: { enabled: true, alertChannel: "securite-alertes", logChannel: "logs-RaidDefender" },
      thresholds: { joinsPerMinute: 12, mentionsPerMessage: 5, messagesPerTenSeconds: 8, accountAgeDays: 7 },
      modules: Object.fromEntries(modules.map(([key]) => [key, true]))
    };
  }
  populate();
}

// 8. Événements utilisateur
document.addEventListener("change", (event) => {
  if (event.target.dataset.module) {
    config.modules[event.target.dataset.module] = event.target.checked;
    $("#moduleTotal").textContent = `${countActive()} / ${modules.length}`;
    save();
  }
});

$("#masterSwitch").addEventListener("change", (event) => {
  config.general.enabled = event.target.checked;
  const lang = getCurrentLang();
  $("#masterText").textContent = event.target.checked ? i18n[lang].masterEnabled : i18n[lang].masterDisabled;
  changeLanguage(lang);
  save(event.target.checked ? "protEnabled" : "protDisabled");
});

$("#enableAll").addEventListener("click", () => {
  modules.forEach(([key]) => (config.modules[key] = true));
  renderModules();
  save("allActive");
});

$("#disableAll").addEventListener("click", () => {
  modules.forEach(([key]) => (config.modules[key] = false));
  renderModules();
  save("allDisabled");
});

$("#settingsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  config.general.alertChannel = values.alertChannel;
  config.general.logChannel = values.logChannel;
  ["joinsPerMinute", "mentionsPerMessage", "messagesPerTenSeconds", "accountAgeDays"].forEach(
    (key) => (config.thresholds[key] = Number(values[key]))
  );
  save();
});

document.querySelectorAll("[data-action]").forEach((button) =>
  button.addEventListener("click", () =>
    toast(button.dataset.action === "raid" ? "Mode raid activé" : "Action enregistrée dans les logs")
  )
);

const menuBtn = $(".menu-button");
if (menuBtn) {
  menuBtn.addEventListener("click", () => $(".sidebar").classList.toggle("open"));
}

// Lancement au chargement
load();
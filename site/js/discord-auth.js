(async () => {
  // Récupère l'URL de la décoration d'avatar Discord si présente
  function avatarDecorationUrl(user) {
    if (user.avatar_decoration_data && user.avatar_decoration_data.asset) {
      return `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png`;
    }
    return null;
  }

  // Récupère l'URL de l'avatar utilisateur (avec support GIF)
  function avatarUrl(user, size = 64) {
    if (user.avatar) {
      const ext = user.avatar.startsWith("a_") ? "gif" : "png";
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
    }
    const index = Number(BigInt(user.id) % 6n);
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }

  // Récupère l'URL de l'icône du serveur
  function guildIconUrl(guild, size = 64) {
    if (guild.icon) {
      const ext = guild.icon.startsWith("a_") ? "gif" : "png";
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${ext}?size=${size}`;
    }
    return null;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function logoutUrl() {
    return "/.netlify/functions/discord-logout?redirect=" + encodeURIComponent("/pages/index.html");
  }

  function selectGuild(guild) {
    const name = document.querySelector("#guildName");
    if (name) name.textContent = guild.name || "Serveur";

    const statusGuild = document.querySelector("#statusGuild");
    if (statusGuild) statusGuild.textContent = guild.name || "Serveur";

    document.querySelectorAll(".server-icon").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.guildId === guild.id);
    });

    try {
      localStorage.setItem("raidDefender-selected-guild", guild.id);
    } catch {}
  }

  function renderGuildRail(guilds) {
    const picker = document.querySelector("#guildPicker");
    if (!picker) return;

    if (!guilds.length) {
      picker.innerHTML = '<p class="server-empty">Aucun serveur admin + bot</p>';
      return;
    }

    const saved = (() => {
      try {
        return localStorage.getItem("raidDefender-selected-guild");
      } catch {
        return null;
      }
    })();

    const activeId = (saved && guilds.some((g) => g.id === saved) && saved) || guilds[0].id;

    picker.innerHTML = guilds
      .map((guild) => {
        const icon = guildIconUrl(guild, 96);
        const letter = escapeHtml((guild.name || "?").slice(0, 1).toUpperCase());
        const title = escapeHtml(guild.name || "Serveur");
        const active = guild.id === activeId ? " active" : "";
        const inner = icon
          ? `<img src="${icon}" alt="${title}" width="48" height="48">`
          : letter;
        return `<button type="button" class="server-icon${active}" data-guild-id="${guild.id}" title="${title}" aria-label="${title}"><span class="pill"></span>${inner}</button>`;
      })
      .join("");

    picker.querySelectorAll(".server-icon").forEach((btn) => {
      btn.addEventListener("click", () => {
        const guild = guilds.find((g) => g.id === btn.dataset.guildId);
        if (guild) selectGuild(guild);
      });
    });

    const current = guilds.find((g) => g.id === activeId) || guilds[0];
    selectGuild(current);
  }

  // Crée la structure HTML pour l'avatar et sa décoration
  function createAvatarContainerHTML(imgUrl, decorationUrl, altText, sizeClass = "avatar-dashboard") {
    const decoHTML = decorationUrl
      ? `<img class="discord-decoration" src="${decorationUrl}" alt="" aria-hidden="true">`
      : "";

    return `
      <div class="discord-avatar-wrapper ${sizeClass}">
        <img class="discord-avatar-img" src="${imgUrl}" alt="${altText}">
        ${decoHTML}
      </div>
    `;
  }

  const login = document.querySelector("[data-discord-login]");

  try {
    const response = await fetch("/.netlify/functions/discord-me", {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok) return;

    const user = await response.json();
    const displayName = user.global_name || user.username || "Utilisateur";
    const nameEscaped = escapeHtml(displayName);
    const img = avatarUrl(user, 128);
    const deco = avatarDecorationUrl(user);

    // 1. Sur la page d'accueil
    if (login) {
      const wrap = document.createElement("div");
      wrap.className = "user-menu";
      const avatarHTML = createAvatarContainerHTML(img, deco, nameEscaped, "avatar-header");

      wrap.innerHTML = `
        <a class="user-chip" href="dashboard.html" title="${nameEscaped}">
          ${avatarHTML}
          <span class="user-chip-name">${nameEscaped}</span>
        </a>
        <a class="logout-btn" href="${logoutUrl()}" title="Se déconnecter">Déconnexion</a>
      `;
      login.replaceWith(wrap);
    }

    // 2. Dans la topbar du Dashboard
    const avatarBtn = document.querySelector(".avatar");
    if (avatarBtn) {
      avatarBtn.style.background = "transparent";
      avatarBtn.style.border = "none";
      avatarBtn.style.padding = "0";
      avatarBtn.style.overflow = "visible";
      avatarBtn.title = nameEscaped;

      avatarBtn.innerHTML = createAvatarContainerHTML(img, deco, nameEscaped, "avatar-dashboard");

      const actions = document.querySelector(".top-actions");
      if (actions && !actions.querySelector(".dashboard-logout")) {
        const a = document.createElement("a");
        a.className = "logout-btn dashboard-logout";
        a.href = logoutUrl();
        a.textContent = "Déconnexion";
        a.title = "Se déconnecter";
        actions.insertBefore(a, actions.firstChild);
      }
    }

    // 3. Salutation
    const helloName = document.querySelector("#userName");
    if (helloName) {
      helloName.textContent = displayName;
    }

    // 4. Serveurs Discord
    if (Array.isArray(user.guilds)) {
      renderGuildRail(user.guilds);
    }
  } catch (err) {
    console.warn("discord-auth:", err);
  }
})();
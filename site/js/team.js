const API_URL = "/api/team";

const categories = {
    owner: document.getElementById("owner"),
    coowner: document.getElementById("coowner"),
    direction: document.getElementById("direction"),
    fondation: document.getElementById("fondation"),
    admin: document.getElementById("admin"),
    inspecteur: document.getElementById("inspecteur")
};

const bannerClass = {
    owner: "owner-banner",
    coowner: "coowner-banner",
    direction: "direction-banner",
    fondation: "fondation-banner",
    admin: "admin-banner",
    inspecteur: "inspecteur-banner"
};

function escapeHtml(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function createCard(member) {
    const avatar =
        member.avatar && member.avatar.length
            ? member.avatar
            : "../assets/default-avatar.png";

    return `
<div class="card ${member.category}">
    <div class="banner ${bannerClass[member.category]}"></div>
    <div class="avatar">
        <img
            src="${avatar}"
            alt="${escapeHtml(member.username)}"
            loading="lazy"
            onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'"
        >
        <span class="status online"></span>
    </div>
    <span class="role">
        ${escapeHtml(member.role)}
    </span>
    <h3>
        ${escapeHtml(member.username)}
    </h3>
    <p>
        ${escapeHtml(member.description)}
    </p>
</div>
`;
}

async function loadTeam() {
    try {
        const response = await fetch(API_URL, {
            cache: "no-store"
        });

        if (!response.ok)
            throw new Error("Erreur API");

        const members = await response.json();

        Object.values(categories).forEach(section => {
            if (section)
                section.innerHTML = "";
        });

        members.forEach(member => {
            const container = categories[member.category];
            if (!container)
                return;

            container.innerHTML += createCard(member);
        });

    } catch (err) {
        console.error("Erreur chargement équipe :", err);
    }
}

// Chargement unique au démarrage
loadTeam();
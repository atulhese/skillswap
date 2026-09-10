const API_URL = "http://localhost:5000/api";

const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

if (!currentUser) {
    window.location.href = "index.html";
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    }[character]));
}

function firstValue(match, keys, fallback = "Not available") {
    const value = keys.map((key) => match?.[key]).find((candidate) => (
        candidate !== undefined && candidate !== null && String(candidate).trim() !== ""
    ));

    return value ?? fallback;
}

function normalizeMatch(match) {
    return {
        userId: firstValue(match, ["user_id", "other_user_id"]),
        name: firstValue(match, ["name", "other_user_name"], "SkillSwap member"),
        email: firstValue(match, ["email", "other_user_email"], "Not available"),
        myOfferedSkillId: firstValue(match, ["my_offered_skill_id", "offered_skill_id"]),
        myWantedSkillId: firstValue(match, ["my_wanted_skill_id", "wanted_skill_id"]),
        myOfferedSkill: firstValue(match, ["my_offered_skill", "my_offered_skill_name", "offered_skill"]),
        myWantedSkill: firstValue(match, ["my_wanted_skill", "my_wanted_skill_name", "wanted_skill"]),
        theyCanTeach: firstValue(match, ["they_can_teach", "their_offered_skill", "matched_offer_skill"]),
        theyWantToLearn: firstValue(match, ["they_want_to_learn", "their_wanted_skill", "matched_want_skill"])
    };
}

async function findMatches() {
    const container = document.getElementById("matches");
    container.innerHTML = "<p>Searching for matches...</p>";

    try {
        const response = await fetch(`${API_URL}/matches/${currentUser.user_id}`);
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.message || "Unable to find matches");
        }

        const matches = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.matches) ? payload.matches : [];

        if (matches.length === 0) {
            container.innerHTML = `
                <div class="empty-message">
                    <h3>No matches found</h3>
                    <p>Add at least one OFFER and one WANT skill to find a mutual match.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = "";

        matches.map(normalizeMatch).forEach((match) => {
            const div = document.createElement("div");
            div.className = "match-card";
            div.innerHTML = `
                <h3>${escapeHtml(match.name)}</h3>
                <p>Email: ${escapeHtml(match.email)}</p>
                <hr>
                <p><strong>You offer:</strong> ${escapeHtml(match.myOfferedSkill)}</p>
                <p><strong>You want:</strong> ${escapeHtml(match.myWantedSkill)}</p>
                <p><strong>${escapeHtml(match.name)} offers:</strong> ${escapeHtml(match.theyCanTeach)}</p>
                <p><strong>${escapeHtml(match.name)} wants:</strong> ${escapeHtml(match.theyWantToLearn)}</p>
                <button class="action-btn" type="button">Send Swap Request</button>
            `;

            const button = div.querySelector("button");
            const hasIds = Number.isInteger(Number(match.userId)) && Number.isInteger(Number(match.myOfferedSkillId)) && Number.isInteger(Number(match.myWantedSkillId));
            button.disabled = !hasIds;
            button.title = hasIds ? "Send a swap request" : "This match is missing skill identifiers";
            button.addEventListener("click", () => sendSwapRequest(
                match.userId,
                match.myOfferedSkillId,
                match.myWantedSkillId,
                button
            ));
            container.appendChild(div);
        });
    } catch (error) {
        console.error("[v0] Match loading error:", error);
        container.innerHTML = `<p>Unable to load matches. ${escapeHtml(error.message)}</p>`;
    }
}

async function sendSwapRequest(receiverId, offeredSkillId, requestedSkillId, button) {
    button.disabled = true;
    button.innerText = "Sending...";

    try {
        const response = await fetch(`${API_URL}/swap-request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                requester_id: currentUser.user_id,
                receiver_id: receiverId,
                offered_skill_id: offeredSkillId,
                requested_skill_id: requestedSkillId
            })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to send request");
        }

        alert(data.message || "Swap request sent successfully!");
        button.innerText = "Request Sent";
    } catch (error) {
        console.error("[v0] Swap request error:", error);
        alert(error.message || "Unable to send request.");
        button.disabled = false;
        button.innerText = "Send Swap Request";
    }
}

function logout() {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
}

if (currentUser) {
    findMatches();
}

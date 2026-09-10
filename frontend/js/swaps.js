const API_URL = "http://localhost:5000/api";
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) window.location.href = "index.html";

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[character]));
}

async function loadSwaps() {
    const container = document.getElementById("swaps");
    container.innerHTML = "<p>Loading active swaps...</p>";

    try {
        const response = await fetch(`${API_URL}/swaps/${currentUser.user_id}`);
        const swaps = await response.json();
        if (!response.ok) throw new Error(swaps.message || "Unable to load active swaps");

        if (!swaps.length) {
            container.innerHTML = '<div class="empty-message"><h3>No active swaps yet</h3><p>Accepted skill exchanges and their meeting details will appear here.</p></div>';
            return;
        }

        container.innerHTML = swaps.map(swap => {
            const hasMeeting = Boolean(swap.zoom_join_url);
            const meetingDate = swap.zoom_start_time ? new Date(swap.zoom_start_time).toLocaleString() : "Not scheduled";
            return `<article class="swap-card">
                <div class="swap-card-header"><div><h3>${escapeHtml(swap.partner_name)}</h3><p>Exchanging <strong>${escapeHtml(swap.your_skill)}</strong> for <strong>${escapeHtml(swap.partner_skill)}</strong></p></div><span class="swap-status">${escapeHtml(swap.swap_status)}</span></div>
                <div class="meeting-panel ${hasMeeting ? "meeting-ready" : "meeting-pending"}">
                    <h4>${hasMeeting ? "Zoom meeting ready" : "Zoom meeting unavailable"}</h4>
                    <p>${hasMeeting ? `Join time: ${escapeHtml(meetingDate)} · ${escapeHtml(swap.zoom_duration || 60)} minutes` : "The swap was accepted, but a meeting link was not created. Contact support or retry acceptance."}</p>
                    ${hasMeeting ? `<a class="action-btn" href="${escapeHtml(swap.zoom_join_url)}" target="_blank" rel="noopener noreferrer">Join Zoom meeting</a><p class="meeting-meta">Meeting ID: ${escapeHtml(swap.zoom_meeting_id)}${swap.zoom_password ? ` · Passcode: ${escapeHtml(swap.zoom_password)}` : ""}</p>` : ""}
                </div>
                <button class="complete-btn" onclick="completeSwap(${Number(swap.swap_id)})">Mark swap complete</button>
            </article>`;
        }).join("");
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    }
}

async function completeSwap(swapId) {
    const response = await fetch(`${API_URL}/swaps/${swapId}/complete`, { method: "PUT" });
    const data = await response.json();
    alert(data.message);
    if (response.ok) loadSwaps();
}

function logout() {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
}

loadSwaps();
window.loadSwaps = loadSwaps;
window.completeSwap = completeSwap;
window.logout = logout;

// Expose the loader for the page refresh action.













































































































































































































































































































































































































































































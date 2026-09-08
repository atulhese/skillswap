const API_URL = "http://localhost:5000/api";

const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));


if (!currentUser) {

    window.location.href = "index.html";

}


// ===============================
// FIND MATCHES
// ===============================

async function findMatches() {

    const container =
        document.getElementById("matches");


    container.innerHTML =
        "<p>Searching for matches...</p>";


    try {

        const response =
            await fetch(
                `${API_URL}/matches/${currentUser.user_id}`
            );


        const matches =
            await response.json();


        if (!response.ok) {

            container.innerHTML =
                `<p>${matches.message}</p>`;

            return;

        }


        if (matches.length === 0) {

            container.innerHTML = `

                <div class="empty-message">

                    <h3>No matches found</h3>

                    <p>
                        Add more OFFER and WANT skills
                        to find a mutual match.
                    </p>

                </div>

            `;

            return;

        }


        container.innerHTML = "";


        matches.forEach(match => {

            const div =
                document.createElement("div");

            div.className =
                "match-card";


            div.innerHTML = `

                <h3>
                    ${match.name}
                </h3>

                <p>
                    Email:
                    ${match.email}
                </p>

                <hr>

                <p>
                    <strong>You offer:</strong>
                    ${match.my_offered_skill}
                </p>

                <p>
                    <strong>You want:</strong>
                    ${match.my_wanted_skill}
                </p>

                <p>
                    <strong>${match.name} offers:</strong>
                    ${match.they_can_teach}
                </p>

                <p>
                    <strong>${match.name} wants:</strong>
                    ${match.they_want_to_learn}
                </p>


                <button
                    class="action-btn"
                    onclick="sendSwapRequest(
                        ${match.user_id},
                        ${match.my_offered_skill_id},
                        ${match.my_wanted_skill_id}
                    )">

                    Send Swap Request

                </button>

            `;


            container.appendChild(div);

        });


    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Unable to load matches.</p>";

    }

}


// ===============================
// SEND REQUEST
// ===============================

async function sendSwapRequest(
    receiverId,
    offeredSkillId,
    requestedSkillId
) {

    try {

        const response =
            await fetch(
                `${API_URL}/swap-request`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        requester_id:
                            currentUser.user_id,

                        receiver_id:
                            receiverId,

                        offered_skill_id:
                            offeredSkillId,

                        requested_skill_id:
                            requestedSkillId

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message);

            return;

        }


        alert(
            "Swap request sent successfully!"
        );


    } catch (error) {

        console.error(error);

        alert("Unable to send request.");

    }

}


function logout() {

    localStorage.removeItem("currentUser");

    window.location.href = "index.html";

}


findMatches();
const API_URL = "http://localhost:5000/api";

const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));


if (!currentUser) {

    window.location.href = "index.html";

}


// ===============================
// LOAD REQUESTS
// ===============================

async function loadRequests() {

    const container =
        document.getElementById("requests");


    container.innerHTML =
        "<p>Loading requests...</p>";


    try {

        const response =
            await fetch(
                `${API_URL}/requests/${currentUser.user_id}`
            );


        const requests =
            await response.json();


        if (!response.ok) {

            container.innerHTML =
                `<p>${requests.message}</p>`;

            return;

        }


        if (requests.length === 0) {

            container.innerHTML =
                "<p>No swap requests received.</p>";

            return;

        }


        container.innerHTML = "";


        requests.forEach(request => {

            const div =
                document.createElement("div");

            div.className =
                "request-card";


            div.innerHTML = `

                <h3>
                    ${request.sender_name}
                </h3>

                <p>
                    Email:
                    ${request.sender_email}
                </p>

                <p>
                    They offer:
                    <strong>
                        ${request.offered_skill}
                    </strong>
                </p>

                <p>
                    They want:
                    <strong>
                        ${request.requested_skill}
                    </strong>
                </p>

                <p>
                    Status:
                    <strong>
                        ${request.swap_status}
                    </strong>
                </p>


                ${
                    request.swap_status === "Pending"

                    ?

                    `

                    <button
                        class="action-btn"
                        onclick="acceptRequest(${request.swap_id})">

                        Accept

                    </button>


                    <button
                        class="reject-btn"
                        onclick="rejectRequest(${request.swap_id})">

                        Reject

                    </button>

                    `

                    :

                    ""

                }

            `;


            container.appendChild(div);

        });


    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Unable to load requests.</p>";

    }

}


// ===============================
// ACCEPT
// ===============================

async function acceptRequest(swapId) {

    try {

        const response =
            await fetch(
                `${API_URL}/swap-request/${swapId}/accept`,
                {
                    method: "PUT"
                }
            );


        const data =
            await response.json();


        alert(data.message);


        loadRequests();


    } catch (error) {

        console.error(error);

        alert("Unable to accept request.");

    }

}


// ===============================
// REJECT
// ===============================

async function rejectRequest(swapId) {

    try {

        const response =
            await fetch(
                `${API_URL}/swap-request/${swapId}/reject`,
                {
                    method: "PUT"
                }
            );


        const data =
            await response.json();


        alert(data.message);


        loadRequests();


    } catch (error) {

        console.error(error);

        alert("Unable to reject request.");

    }

}


function logout() {

    localStorage.removeItem("currentUser");

    window.location.href = "index.html";

}


loadRequests();
const API = "http://localhost:5000";

let currentUser = null;
let allSkills = [];


// =====================================
// AUTH TABS
// =====================================

function switchAuthTab(tab) {

    const loginForm =
        document.getElementById("loginForm");

    const registerForm =
        document.getElementById("registerForm");

    const loginTab =
        document.getElementById("loginTab");

    const registerTab =
        document.getElementById("registerTab");


    if (tab === "login") {

        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");

        loginTab.classList.add("active");
        registerTab.classList.remove("active");

    }

    else {

        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");

        loginTab.classList.remove("active");
        registerTab.classList.add("active");

    }

}

// =====================================
// SEND SWAP REQUEST
// =====================================
async function sendSwapRequest(
    receiverId,
    offeredSkillId,
    requestedSkillId,
    button
) {

    if (!currentUser) {
        alert("Please login first");
        return;
    }

    if (button) {
        button.disabled = true;
        button.innerText = "Sending...";
    }

    const requestData = {
        requester_id: currentUser.user_id,
        receiver_id: receiverId,
        offered_skill_id: offeredSkillId,
        requested_skill_id: requestedSkillId
    };

    console.log("Sending swap request:", requestData);

    try {

        const response = await fetch(
            API + "/api/swap-request",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            }
        );

        const data = await response.json();

        console.log("Swap request response:", data);

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to send request"
            );

            if (button) {
                button.disabled = false;
                button.innerText = "✨ Send Swap Request";
            }

            return;
        }

        alert(
            data.message ||
            "Swap request sent successfully"
        );

        if (button) {
            button.innerText = "✅ Request Sent";
            button.disabled = true;
        }

    } catch (error) {

        console.error(
            "Swap Request Error:",
            error
        );

        alert(
            "Unable to connect to backend."
        );

        if (button) {
            button.disabled = false;
            button.innerText = "✨ Send Swap Request";
        }
    }
}


// =====================================
// ACCEPT REQUEST
// =====================================
async function acceptRequest(requestId) {

    if (!confirm("Accept this swap request?")) {
        return;
    }

    try {

        const response = await fetch(
            API +
            "/api/swap-request/" +
            requestId +
            "/accept",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        console.log("Accept response:", data);

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to accept request"
            );

            return;
        }

        alert(
            data.message ||
            "Swap request accepted"
        );

        loadRequests();
        loadSwaps();

    } catch (error) {

        console.error(
            "Accept Request Error:",
            error
        );

        alert(
            "Unable to accept request."
        );
    }
}

// =====================================
// REGISTER USER
// =====================================

async function registerUser() {

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const phone =
        document.getElementById("registerPhone").value.trim();

    const password =
        document.getElementById("registerPassword").value;


    if (!name || !email || !phone || !password) {

        alert("Please fill all fields");

        return;

    }


    try {

        const response = await fetch(
            API + "/api/register",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    name: name,
                    email: email,
                    phone: phone,
                    password: password

                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Registration failed"
            );

            return;

        }


        alert(
            "Registration successful! Please login."
        );


        document.getElementById("registerName").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPhone").value = "";
        document.getElementById("registerPassword").value = "";


        switchAuthTab("login");


    }

    catch (error) {

        console.error(
            "Register Error:",
            error
        );

        alert(
            "Cannot connect to backend."
        );

    }

}


// =====================================
// LOGIN USER
// =====================================

async function login() {

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;


    if (!email || !password) {

        alert(
            "Please enter email and password"
        );

        return;

    }


    try {

        const response = await fetch(

            API + "/api/login",

            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    email: email,
                    password: password

                })
            }

        );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Login failed"
            );

            return;

        }


        currentUser = data.user;


        localStorage.setItem(
            "currentUser",
            JSON.stringify(currentUser)
        );


        openDashboard();

    }

    catch (error) {

        console.error(
            "Login Error:",
            error
        );

        alert(
            "Cannot connect to backend."
        );

    }

}


// =====================================
// OPEN DASHBOARD
// =====================================

function openDashboard() {

    document
        .getElementById("authSection")
        .classList.add("hidden");


    document
        .getElementById("dashboardSection")
        .classList.remove("hidden");


    document
        .getElementById("welcomeText")
        .innerText =
        "Welcome, " +
        currentUser.name +
        " 👋";


    loadSkills();

    loadMySkills();

}


// =====================================
// LOGOUT
// =====================================

function logout() {

    localStorage.removeItem(
        "currentUser"
    );


    currentUser = null;


    location.reload();

}


// =====================================
// NAVIGATION
// =====================================

function showSection(sectionId) {

    const sections = [

        "skillsSection",

        "matchSection",

        "requestSection",

        "swapSection"

    ];


    sections.forEach(
        function(section) {

            const sectionElement =
                document.getElementById(section);

            const navElement =
                document.getElementById(
                    "nav-" + section
                );


            if (sectionElement) {

                sectionElement
                    .classList
                    .add("hidden");

            }


            if (navElement) {

                navElement
                    .classList
                    .remove(
                        "active-nav"
                    );

            }

        }
    );


    const selectedSection =
        document.getElementById(sectionId);


    const selectedNav =
        document.getElementById(
            "nav-" + sectionId
        );


    if (selectedSection) {

        selectedSection
            .classList
            .remove("hidden");

    }


    if (selectedNav) {

        selectedNav
            .classList
            .add("active-nav");

    }


    if (sectionId === "matchSection") {

        findMatches();

    }


    if (sectionId === "requestSection") {

        loadRequests();

    }


    if (sectionId === "swapSection") {

        loadSwaps();

    }

}


// =====================================
// LOAD ALL SKILLS
// =====================================

async function loadSkills() {

    try {

        const response =
            await fetch(
                API + "/api/skills"
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(data);

            return;

        }


        allSkills = data;


        const skillSelect =
            document.getElementById(
                "skillSelect"
            );


        if (!skillSelect) {

            return;

        }


        skillSelect.innerHTML =
            `<option value="">
                Select Skill
            </option>`;


        allSkills.forEach(
            function(skill) {

                skillSelect.innerHTML +=

                    `<option value="${skill.skill_id}">
                        ${skill.skill_name}
                    </option>`;

            }
        );

    }

    catch (error) {

        console.error(
            "Load Skills Error:",
            error
        );

    }

}


// =====================================
// ADD SKILL
// =====================================

async function addSkill() {

    if (!currentUser) {

        alert("Please login first");

        return;

    }


    const skillSelect =
        document.getElementById(
            "skillSelect"
        );


    const skillType =
        document.getElementById(
            "skillType"
        );


    if (!skillSelect || !skillType) {

        alert(
            "Skill form elements not found"
        );

        return;

    }


    const skillId =
        skillSelect.value;


    const type =
        skillType.value;


    if (!skillId || !type) {

        alert(
            "Please select skill and type"
        );

        return;

    }


    try {

        const response =
            await fetch(

                API + "/api/user-skills",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        user_id:
                            currentUser.user_id,

                        skill_id:
                            Number(skillId),

                        skill_type:
                            type

                    })

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to add skill"
            );

            return;

        }


        alert(
            "Skill added successfully"
        );


        skillSelect.value = "";


        loadMySkills();

    }

    catch (error) {

        console.error(
            "Add Skill Error:",
            error
        );

        alert(
            "Cannot connect to backend"
        );

    }

}


// =====================================
// LOAD MY SKILLS
// =====================================

async function loadMySkills() {

    if (!currentUser) {

        return;

    }


    const container =
        document.getElementById(
            "mySkills"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "<p>Loading your skills...</p>";


    try {

        const response =
            await fetch(

                API +
                "/api/user-skills/" +
                encodeURIComponent(
                    currentUser.user_id
                )

            );


        const skills =
            await response.json();


        if (!response.ok) {

            container.innerHTML =

                `<p style="color:red;">
                    ${skills.message ||
                    "Unable to load skills"}
                </p>`;

            return;

        }


        container.innerHTML = "";


        if (skills.length === 0) {

            container.innerHTML =

                `<p>
                    You have not added any skills yet.
                </p>`;

            return;

        }


        skills.forEach(
            function(skill) {

                container.innerHTML +=

                    `<div class="skill-box">

                        <h3>
                            ${skill.skill_name}
                        </h3>

                        <p>
                            Type:
                            <b>
                                ${skill.skill_type}
                            </b>
                        </p>

                    </div>`;

            }
        );

    }

    catch (error) {

        console.error(
            "My Skills Error:",
            error
        );


        container.innerHTML =

            `<p style="color:red;">
                Cannot connect to backend.
            </p>`;

    }

}


// =====================================
// FIND MUTUAL MATCHES
// =====================================

async function findMatches() {

    if (!currentUser) {

        return;

    }


    const container =
        document.getElementById(
            "matches"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "<p>Loading matches...</p>";


    try {

        const response =
            await fetch(

                API +
                "/api/matches/" +
                encodeURIComponent(
                    currentUser.user_id
                )

            );


        const matches =
            await response.json();


        container.innerHTML = "";


        if (!response.ok) {

            container.innerHTML =

                `<p style="color:red;">
                    ${matches.message ||
                    "Unable to load matches"}
                </p>`;

            return;

        }


        if (matches.length === 0) {

            container.innerHTML =

                `<div class="match-card">

                    <h3>
                        No Mutual Matches Found
                    </h3>

                    <p>
                        Add at least:
                    </p>

                    <p>
                        ✅ One skill as OFFER
                    </p>

                    <p>
                        ✅ One skill as WANT
                    </p>

                    <hr>

                    <p>
                        Another user must have:
                    </p>

                    <p>
                        ✅ Your WANT as their OFFER
                    </p>

                    <p>
                        ✅ Your OFFER as their WANT
                    </p>

                </div>`;

            return;

        }


        container.innerHTML =

            `<p>
                <b>
                    ${matches.length}
                </b>
                mutual match(es) found.
            </p>`;


        matches.forEach(
            function(match) {

                container.innerHTML +=

                    `<div class="match-card">

                        <h3>
                            👤 ${match.name}
                        </h3>


                        <p>
                            <b>
                                You Can Teach:
                            </b>

                            ${match.my_offered_skill}
                        </p>


                        <p>
                            <b>
                                You Want To Learn:
                            </b>

                            ${match.my_wanted_skill}
                        </p>


                        <hr>


                        <p>
                            <b>
                                ${match.name}
                                Can Teach:
                            </b>

                            ${match.they_can_teach}
                        </p>


                        <p>
                            <b>
                                ${match.name}
                                Wants:
                            </b>

                            ${match.they_want_to_learn}
                        </p>


                        <button

                            class="action-btn"

                            onclick="
                                sendSwapRequest(
                                    ${match.user_id},
                                    ${match.my_offered_skill_id},
                                    ${match.my_wanted_skill_id},
                                    this
                                )
                            "

                        >

                            ✨ Send Swap Request

                        </button>


                    </div>`;

            }
        );

    }

    catch (error) {

        console.error(
            "Find Match Error:",
            error
        );


        container.innerHTML =

            `<p style="color:red;">
                Cannot connect to backend.
                Make sure Node.js server is running.
            </p>`;

    }

}


// =====================================
// SEND SWAP REQUEST
// =====================================

async function sendSwapRequest(

    receiverId,

    offeredSkillId,

    requestedSkillId,

    button

) {

    if (!currentUser) {

        alert(
            "Please login first"
        );

        return;

    }


    /*
        Prevent double clicking
    */

    if (button) {

        button.disabled = true;

        button.innerText =
            "Sending...";

    }


    try {

        const response =
            await fetch(

                API + "/api/swap-request",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

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

            alert(

                data.message ||
                "Unable to send request"

            );


            if (button) {

                button.disabled = false;

                button.innerText =
                    "✨ Send Swap Request";

            }


            return;

        }


        alert(

            data.message ||
            "Swap request sent successfully"

        );


        if (button) {

            button.innerText =
                "✅ Request Sent";

            button.disabled = true;

        }

    }

    catch (error) {

        console.error(
            "Swap Request Error:",
            error
        );


        alert(
            "Unable to send swap request."
        );


        if (button) {

            button.disabled = false;

            button.innerText =
                "✨ Send Swap Request";

        }

    }

}


// =====================================
// LOAD RECEIVED REQUESTS
// =====================================

async function loadRequests() {

    if (!currentUser) {

        return;

    }


    const container =
        document.getElementById(
            "requests"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "<p>Loading requests...</p>";


    try {

        const response =
            await fetch(

                API +
                "/api/requests/" +
                encodeURIComponent(
                    currentUser.user_id
                )

            );


        const requests =
            await response.json();


        container.innerHTML = "";


        if (!response.ok) {

            container.innerHTML =

                `<p style="color:red;">
                    ${requests.message ||
                    "Unable to load requests"}
                </p>`;

            return;

        }


        if (requests.length === 0) {

            container.innerHTML =

                `<p>
                    No swap requests received.
                </p>`;

            return;

        }


        requests.forEach(
            function(request) {

                let buttons = "";


                if (
                    request.status ===
                    "PENDING"
                ) {

                    buttons =

                        `<button
                            class="action-btn"
                            onclick="
                                acceptRequest(
                                    ${request.request_id}
                                )
                            "
                        >
                            ✅ Accept
                        </button>


                        <button
                            class="action-btn"
                            onclick="
                                rejectRequest(
                                    ${request.request_id}
                                )
                            "
                        >
                            ❌ Reject
                        </button>`;

                }


                container.innerHTML +=

                    `<div class="request-card">

                        <h3>
                            👤
                            ${request.requester_name}
                        </h3>


                        <p>
                            <b>
                                They Can Teach:
                            </b>

                            ${request.offered_skill}
                        </p>


                        <p>
                            <b>
                                They Want:
                            </b>

                            ${request.requested_skill}
                        </p>


                        <p>
                            <b>
                                Status:
                            </b>

                            ${request.status}
                        </p>


                        ${buttons}

                    </div>`;

            }
        );

    }

    catch (error) {

        console.error(
            "Load Requests Error:",
            error
        );


        container.innerHTML =

            `<p style="color:red;">
                Cannot connect to backend.
            </p>`;

    }

}


// =====================================
// ACCEPT REQUEST
// =====================================

async function acceptRequest(
    requestId
) {

    if (
        !confirm(
            "Accept this swap request?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(

                API +
                "/api/swap-request/" +
                requestId +
                "/accept",

                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    }

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(

                data.message ||
                "Unable to accept request"

            );

            return;

        }


        alert(

            data.message ||
            "Swap request accepted"

        );


        loadRequests();

        loadSwaps();

    }

    catch (error) {

        console.error(
            "Accept Request Error:",
            error
        );


        alert(
            "Unable to accept request."
        );

    }

}


// =====================================
// REJECT REQUEST
// =====================================

async function rejectRequest(
    requestId
) {

    if (
        !confirm(
            "Reject this swap request?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(

                API +
                "/api/swap-request/" +
                requestId +
                "/reject",

                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    }

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(

                data.message ||
                "Unable to reject request"

            );

            return;

        }


        alert(

            data.message ||
            "Swap request rejected"

        );


        loadRequests();

    }

    catch (error) {

        console.error(
            "Reject Request Error:",
            error
        );


        alert(
            "Unable to reject request."
        );

    }

}


// =====================================
// LOAD ACTIVE SWAPS
// =====================================

async function loadSwaps() {

    if (!currentUser) {

        return;

    }


    const container =
        document.getElementById(
            "swaps"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "<p>Loading active swaps...</p>";


    try {

        const response =
            await fetch(

                API +
                "/api/swaps/" +
                encodeURIComponent(
                    currentUser.user_id
                )

            );


        const swaps =
            await response.json();


        container.innerHTML = "";


        if (!response.ok) {

            container.innerHTML =

                `<p style="color:red;">
                    ${swaps.message ||
                    "Unable to load swaps"}
                </p>`;

            return;

        }


        if (swaps.length === 0) {

            container.innerHTML =

                `<p>
                    No active swaps.
                </p>`;

            return;

        }


        swaps.forEach(
            function(swap) {

                container.innerHTML +=

                    `<div class="match-card">

                        <h3>
                            🔄 Skill Swap
                        </h3>


                        <p>
                            <b>
                                Partner:
                            </b>

                            ${swap.partner_name}
                        </p>


                        <p>
                            <b>
                                Your Skill:
                            </b>

                            ${swap.your_skill}
                        </p>


                        <p>
                            <b>
                                Partner Skill:
                            </b>

                            ${swap.partner_skill}
                        </p>


                        <p>
                            <b>
                                Status:
                            </b>

                            ${swap.status}
                        </p>


                        <button

                            class="action-btn"

                            onclick="
                                completeSwap(
                                    ${swap.swap_id}
                                )
                            "

                        >

                            ✅ Complete Swap

                        </button>


                    </div>`;

            }
        );

    }

    catch (error) {

        console.error(
            "Load Swaps Error:",
            error
        );


        container.innerHTML =

            `<p style="color:red;">
                Cannot connect to backend.
            </p>`;

    }

}


// =====================================
// COMPLETE SWAP
// =====================================

async function completeSwap(
    swapId
) {

    if (
        !confirm(
            "Mark this swap as completed?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(

                API +
                "/api/swaps/" +
                swapId +
                "/complete",

                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    }

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(

                data.message ||
                "Unable to complete swap"

            );

            return;

        }


        alert(

            data.message ||
            "Swap completed successfully"

        );


        loadSwaps();

    }

    catch (error) {

        console.error(
            "Complete Swap Error:",
            error
        );


        alert(
            "Unable to complete swap."
        );

    }

}


// =====================================
// AUTO LOGIN
// =====================================

window.onload = function () {

    const savedUser =
        localStorage.getItem(
            "currentUser"
        );


    if (savedUser) {

        try {

            currentUser =
                JSON.parse(savedUser);


            if (
                currentUser &&
                currentUser.user_id
            ) {

                openDashboard();

            }

        }

        catch (error) {

            console.error(
                "Saved User Error:",
                error
            );


            localStorage.removeItem(
                "currentUser"
            );

        }

    }

};
const API_URL = "http://localhost:5000/api";

const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));


if (!currentUser) {

    window.location.href = "index.html";

}


// ===============================
// LOAD SKILLS
// ===============================

async function loadSkills() {

    try {

        const response =
            await fetch(`${API_URL}/skills`);

        const skills =
            await response.json();


        const select =
            document.getElementById("skillSelect");


        select.innerHTML =
            `<option value="">-- Choose a Skill --</option>`;


        skills.forEach(skill => {

            const option =
                document.createElement("option");

            option.value =
                skill.skill_id;

            option.textContent =
                skill.skill_name;

            select.appendChild(option);

        });


    } catch (error) {

        console.error(error);

        alert("Unable to load skills.");

    }

}


// ===============================
// ADD SKILL
// ===============================

async function addSkill() {

    const skillId =
        document.getElementById("skillSelect").value;

    const skillType =
        document.getElementById("skillType").value;


    if (!skillId || !skillType) {

        alert("Please select skill and goal type.");

        return;

    }


    try {

        const response =
            await fetch(`${API_URL}/user-skills`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    user_id: currentUser.user_id,

                    skill_id: skillId,

                    skill_type: skillType

                })

            });


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message);

            return;

        }


        alert("Skill added successfully!");


        document.getElementById("skillSelect").value = "";
        document.getElementById("skillType").value = "";


        loadMySkills();


    } catch (error) {

        console.error(error);

        alert("Unable to add skill.");

    }

}


// ===============================
// LOAD MY SKILLS
// ===============================

async function loadMySkills() {

    try {

        const response =
            await fetch(
                `${API_URL}/user-skills/${currentUser.user_id}`
            );


        const skills =
            await response.json();


        const container =
            document.getElementById("mySkills");


        if (skills.length === 0) {

            container.innerHTML =
                "<p>No skills added yet.</p>";

            return;

        }


        container.innerHTML = "";


        skills.forEach(skill => {

            const div =
                document.createElement("div");

            div.className = "skill-card";


            div.innerHTML = `

                <h3>${skill.skill_name}</h3>

                <p>
                    Type:
                    <strong>
                        ${skill.skill_type}
                    </strong>
                </p>

            `;


            container.appendChild(div);

        });


    } catch (error) {

        console.error(error);

    }

}


function logout() {

    localStorage.removeItem("currentUser");

    window.location.href = "index.html";

}


// INITIAL LOAD

loadSkills();

loadMySkills();
const API_URL = "http://localhost:5000/api";


// ===============================
// SWITCH LOGIN / REGISTER
// ===============================

function switchAuthTab(type) {

    const loginForm =
        document.getElementById("loginForm");

    const registerForm =
        document.getElementById("registerForm");

    const loginTab =
        document.getElementById("loginTab");

    const registerTab =
        document.getElementById("registerTab");


    if (type === "login") {

        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");

        loginTab.classList.add("active");
        registerTab.classList.remove("active");

    } else {

        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");

        loginTab.classList.remove("active");
        registerTab.classList.add("active");

    }

}


// ===============================
// LOGIN
// ===============================

async function login() {

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value.trim();


    if (!email || !password) {

        alert("Please enter email and password.");

        return;

    }


    try {

        const response =
            await fetch(`${API_URL}/login`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })

            });


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message);

            return;

        }


        localStorage.setItem(
            "currentUser",
            JSON.stringify(data.user)
        );


        alert("Login successful!");

        window.location.href = "dashboard.html";


    } catch (error) {

        console.error(error);

        alert("Cannot connect to server.");

    }

}


// ===============================
// REGISTER
// ===============================

async function registerUser() {

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const phone =
        document.getElementById("registerPhone").value.trim();

    const password =
        document.getElementById("registerPassword").value.trim();


    if (!name || !email || !phone || !password) {

        alert("Please fill all fields.");

        return;

    }


    try {

        const response =
            await fetch(`${API_URL}/register`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password
                })

            });


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message);

            return;

        }


        alert("Account created successfully!");

        switchAuthTab("login");


    } catch (error) {

        console.error(error);

        alert("Cannot connect to server.");

    }

}
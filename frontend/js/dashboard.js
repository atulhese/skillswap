const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));


if (!currentUser) {

    window.location.href = "index.html";

}


document.getElementById("welcomeText").innerText =
    `Welcome, ${currentUser.name}`;


function logout() {

    localStorage.removeItem("currentUser");

    window.location.href = "index.html";

}
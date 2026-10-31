var USERS_KEY = "ms_demo_users";
var SESSION_KEY = "ms_demo_current_user";

var loginForm = document.getElementById("loginForm");
var registerForm = document.getElementById("registerForm");
var loginTab = document.getElementById("loginTab");
var registerTab = document.getElementById("registerTab");
var message = document.getElementById("message");

// Jika sesi masih aktif, langsung buka aplikasi.
if (localStorage.getItem(SESSION_KEY)) {
    window.location.replace("index.html");
}

function getUsers() {
    try {
        var users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
        return users && typeof users === "object" ? users : {};
    } catch (error) {
        return {};
    }
}

function showMessage(text, type) {
    message.textContent = text;
    message.className = "message " + (type || "");
}

function showLogin() {
    loginForm.hidden = false;
    registerForm.hidden = true;
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    showMessage("", "");
}

function showRegister() {
    loginForm.hidden = true;
    registerForm.hidden = false;
    loginTab.classList.remove("active");
    registerTab.classList.add("active");
    showMessage("", "");
}

async function hashPassword(password) {
    // Hash di browser hanya untuk demo, bukan pengganti autentikasi server.
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Fitur keamanan browser tidak tersedia. Buka situs melalui HTTPS.");
    }

    var bytes = new TextEncoder().encode(password);
    var hash = await window.crypto.subtle.digest("SHA-256", bytes);

    return Array.from(new Uint8Array(hash)).map(function (byte) {
        return byte.toString(16).padStart(2, "0");
    }).join("");
}

loginTab.addEventListener("click", showLogin);
registerTab.addEventListener("click", showRegister);

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    var username = registerForm.username.value.trim().toLowerCase();
    var password = registerForm.password.value;
    var confirmPassword = registerForm.confirmPassword.value;

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        showMessage("Username harus 3 sampai 20 karakter, menggunakan huruf kecil, angka, atau garis bawah.", "error");
        return;
    }

    if (password.length < 6) {
        showMessage("Password minimal 6 karakter.", "error");
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Konfirmasi password tidak sama.", "error");
        return;
    }

    var users = getUsers();

    if (users[username]) {
        showMessage("Username sudah digunakan. Silakan pilih username lain.", "error");
        return;
    }

    try {
        users[username] = {
            passwordHash: await hashPassword(password)
        };
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        localStorage.setItem(SESSION_KEY, username);
        window.location.replace("index.html");
    } catch (error) {
        showMessage(error.message || "Akun tidak dapat dibuat.", "error");
    }
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    var username = loginForm.username.value.trim().toLowerCase();
    var password = loginForm.password.value;
    var users = getUsers();

    if (!users[username]) {
        showMessage("Username atau password salah.", "error");
        return;
    }

    try {
        var passwordHash = await hashPassword(password);

        if (passwordHash !== users[username].passwordHash) {
            showMessage("Username atau password salah.", "error");
            return;
        }

        localStorage.setItem(SESSION_KEY, username);
        window.location.replace("index.html");
    } catch (error) {
        showMessage(error.message || "Login gagal. Silakan coba lagi.", "error");
    }
});
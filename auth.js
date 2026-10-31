var USERS_KEY = "ms_demo_users";
var SESSION_KEY = "ms_demo_current_user";

var loginForm = document.getElementById("loginForm");
var registerForm = document.getElementById("registerForm");
var showRegisterButton = document.getElementById("showRegister");
var switchText = document.getElementById("switchText");
var subtitle = document.getElementById("authSubtitle");
var message = document.getElementById("message");

// Jika sesi masih aktif, langsung masuk ke aplikasi.
if (localStorage.getItem(SESSION_KEY)) {
    window.location.replace("index.html");
}

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
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

    subtitle.textContent =
        "Masuk untuk mengelola daftar belanjamu.";

    switchText.innerHTML =
        'Belum punya akun? <button type="button" class="link-button" id="showRegister">Daftar di sini</button>';

    document.getElementById("showRegister").addEventListener(
        "click",
        showRegister
    );

    showMessage("", "");
}

function showRegister() {
    loginForm.hidden = true;
    registerForm.hidden = false;

    subtitle.textContent = "Buat akun My Shopping List.";

    switchText.innerHTML =
        'Sudah punya akun? <button type="button" class="link-button" id="showRegister">Kembali ke Login</button>';

    document.getElementById("showRegister").addEventListener(
        "click",
        showLogin
    );

    showMessage("", "");
}

async function hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error(
            "Fitur keamanan tidak tersedia. Buka aplikasi melalui HTTPS."
        );
    }

    var bytes = new TextEncoder().encode(password);
    var hash = await crypto.subtle.digest("SHA-256", bytes);

    return Array.from(new Uint8Array(hash))
        .map(function (byte) {
            return byte.toString(16).padStart(2, "0");
        })
        .join("");
}

// Tombol untuk berpindah ke formulir pendaftaran.
showRegisterButton.addEventListener("click", showRegister);

// Proses pendaftaran akun.
registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    var username = document.getElementById("registerUsername")
        .value.trim().toLowerCase();

    var password = document.getElementById("registerPassword").value;
    var confirmPassword = document.getElementById("confirmPassword").value;

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        showMessage(
            "Username harus 3 sampai 20 karakter, berupa huruf kecil, angka, atau garis bawah.",
            "error"
        );
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
        showMessage("Username sudah digunakan.", "error");
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
        showMessage(error.message || "Pendaftaran gagal.", "error");
    }
});

// Proses login.
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    var username = document.getElementById("loginUsername")
        .value.trim().toLowerCase();

    var password = document.getElementById("loginPassword").value;
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
        showMessage(error.message || "Login gagal.", "error");
    }
});
"use strict";

/* =========================================
   MY SHOPPING LIST
   Application state and configuration
   ========================================= */

const STORAGE_KEY = "myShoppingList.v1";
const THEME_KEY = "shoppingListTheme";
const DEFAULT_THEME = "cherry-blossom";

const CATEGORIES = [
    "Makanan dan Minuman",
    "Kebutuhan Dapur",
    "Perlengkapan Mandi",
    "Perawatan Tubuh",
    "Perlengkapan Rumah",
    "Kebutuhan Pribadi",
    "Lainnya"
];

const THEMES = [
    {
        id: "cherry-blossom",
        name: "Cherry Blossom",
        description: "Tema awal dengan warna biru dan merah muda lembut.",
        colors: ["#5A86CB", "#6C0820", "#F2AEBC", "#F2DCDB", "#3D5D91"]
    },
    {
        id: "classic-blue",
        name: "Classic Blue",
        description: "Tampilan profesional dengan aksen biru klasik.",
        colors: ["#93AEBF", "#1C2F4D", "#F2CEAE", "#D48D91", "#400D01"]
    },
    {
        id: "soft-lavender",
        name: "Soft Lavender",
        description: "Warna lavender lembut dengan aksen ungu.",
        colors: ["#C9B6E4", "#66527F", "#F2ECF8", "#E8D9EE", "#44334F"]
    },
    {
        id: "sage-green",
        name: "Sage Green",
        description: "Palet hijau alami dengan nuansa hangat.",
        colors: ["#A3B18A", "#344E41", "#DAD7CD", "#E8C9A7", "#283618"]
    },
    {
        id: "blush-pink",
        name: "Blush Pink",
        description: "Warna merah muda yang hangat dan elegan.",
        colors: ["#E8AEB7", "#754C5B", "#FFF0E8", "#D9A5A5", "#49313C"]
    },
    {
        id: "midnight-dark",
        name: "Midnight Dark",
        description: "Mode gelap dengan aksen warna keemasan.",
        colors: ["#26364A", "#101827", "#34465C", "#D4B896", "#F2E9DC"]
    }
];

const ICONS = {
    check: '<path d="m5 12 4 4L19 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    back: '<path d="m15 18-6-6 6-6M9 12h12"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    basket: '<path d="m3 10 2 10h14l2-10H3Z"/><path d="m8 10 4-7 4 7M9 14v3m6-3v3"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18h1.2a2.1 2.1 0 0 0 1.5-3.6 1.9 1.9 0 0 1 1.4-3.2H18a3 3 0 0 0 3-3c0-4.5-4-8.2-9-8.2Z"/><circle cx="7.5" cy="11" r=".8"/><circle cx="10" cy="7.5" r=".8"/><circle cx="15" cy="7.5" r=".8"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    settings: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.5a7.9 7.9 0 0 1-1.7 1l-.2 1.5h-2.4l-.3-1.5a7.9 7.9 0 0 1-1.7-1l-1.4.5-1.2-2.1 1.2-.9a7.3 7.3 0 0 1 0-2l-1.2-.9 1.2-2.1 1.4.5a7.9 7.9 0 0 1 1.7-1l.3-1.5h2.4l.2 1.5a7.9 7.9 0 0 1 1.7 1l1.4-.5 1.2 2.1-1.2.9a7.3 7.3 0 0 1-.1 2Z" transform="translate(-1 -1)"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>'
};

let db = { lists: [] };

const state = {
    page: "dash",
    openId: null,
    q: "",
    from: "",
    to: ""
};

let toastTimer = null;

/* =========================================
   STORAGE
   ========================================= */

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (raw) {
            const parsed = JSON.parse(raw);

            if (parsed && Array.isArray(parsed.lists)) {
                db = parsed;
            }
        }
    } catch (error) {
        console.error("Gagal membaca data belanja:", error);
        toast("Data belanja tidak dapat dibaca.");
    }
}

function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        return true;
    } catch (error) {
        console.error("Gagal menyimpan data belanja:", error);
        toast("Data gagal disimpan. Periksa penyimpanan browser.");
        return false;
    }
}

function loadTheme() {
    try {
        const savedTheme = localStorage.getItem(THEME_KEY);
        return THEMES.some(theme => theme.id === savedTheme)
            ? savedTheme
            : DEFAULT_THEME;
    } catch (error) {
        console.error("Gagal membaca pengaturan tema:", error);
        return DEFAULT_THEME;
    }
}

function applyTheme(themeId, notify = false) {
    const themeExists = THEMES.some(theme => theme.id === themeId);
    const selectedTheme = themeExists ? themeId : DEFAULT_THEME;

    document.documentElement.dataset.theme = selectedTheme;

    try {
        localStorage.setItem(THEME_KEY, selectedTheme);
    } catch (error) {
        console.error("Gagal menyimpan tema:", error);
    }

    const theme = THEMES.find(item => item.id === selectedTheme);

    document.querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", theme.colors[3]);

    if (notify) {
        toast("Tema " + theme.name + " berhasil diterapkan.");
        render();
    }
}

/* =========================================
   GENERAL UTILITIES
   ========================================= */

function uid() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 9);
}

function today() {
    const date = new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function rp(value) {
    return "Rp" + Math.round(Number(value) || 0).toLocaleString("id-ID");
}

function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function fdate(value) {
    if (!value) return "-";

    const date = new Date(value + "T00:00:00");

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function icon(name, className = "") {
    const path = ICONS[name] || ICONS.basket;

    return '<svg class="' + esc(className) +
        '" viewBox="0 0 24 24" aria-hidden="true">' +
        path + "</svg>";
}

function sub(item) {
    return (Number(item.price) || 0) * (Number(item.qty) || 0);
}

function stats(list) {
    const result = {
        n: list.items.length,
        done: 0,
        total: 0,
        doneTotal: 0
    };

    list.items.forEach(item => {
        result.total += sub(item);

        if (item.done) {
            result.done += 1;
            result.doneTotal += sub(item);
        }
    });

    result.left = result.n - result.done;
    result.leftTotal = result.total - result.doneTotal;
    result.pct = result.n
        ? Math.round(result.done / result.n * 100)
        : 0;

    return result;
}

function toast(message) {
    const element = document.getElementById("toast");

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        element.classList.remove("show");
    }, 2400);
}

function find(id) {
    return db.lists.find(list => list.id === id) || null;
}

function go(page, id = null) {
    state.page = page;
    state.openId = id;

    render();
    window.scrollTo({ top: 0, behavior: "smooth" });

    document.getElementById("sidebar").classList.remove("open");
}

/* =========================================
   MODAL AND CONFIRMATION
   ========================================= */

function closeModal() {
    document.getElementById("modal").innerHTML = "";
}

function openModal(content) {
    document.getElementById("modal").innerHTML =
        '<div class="modal" id="modalBackdrop">' +
            '<section class="box" role="dialog" aria-modal="true">' +
                content +
            "</section>" +
        "</div>";

    const backdrop = document.getElementById("modalBackdrop");

    backdrop.addEventListener("click", event => {
        if (event.target === backdrop) closeModal();
    });

    document.addEventListener("keydown", handleModalEscape);
}

function handleModalEscape(event) {
    if (event.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", handleModalEscape);
    }
}

function confirmBox(message, callback) {
    openModal(
        "<h3>Konfirmasi Penghapusan</h3>" +
        "<p>" + esc(message) + "</p>" +
        '<div class="acts">' +
            '<button class="btn alt" id="confirmCancel" type="button">Batal</button>' +
            '<button class="btn del" id="confirmDelete" type="button">' +
                icon("trash") + " Hapus" +
            "</button>" +
        "</div>"
    );

    document.getElementById("confirmCancel").onclick = closeModal;

    document.getElementById("confirmDelete").onclick = () => {
        closeModal();
        callback();
    };
}

/* =========================================
   SHOPPING LIST FORM
   ========================================= */

function listForm(id = null) {
    const existing = id ? find(id) : null;

    if (id && !existing) {
        toast("Daftar tidak ditemukan.");
        return;
    }

    const list = existing || {
        name: "",
        date: today(),
        store: "",
        note: ""
    };

    openModal(
        "<h3>" + (id ? "Edit Daftar Belanja" : "Buat Daftar Belanja") + "</h3>" +
        '<form id="listForm">' +
            '<div class="f">' +
                '<label for="listName">Nama daftar *</label>' +
                '<input id="listName" name="name" required maxlength="100" value="' +
                    esc(list.name) + '" placeholder="Belanja Bulanan">' +
            "</div>" +
            '<div class="two">' +
                '<div class="f">' +
                    '<label for="listDate">Tanggal belanja *</label>' +
                    '<input id="listDate" type="date" name="date" required value="' +
                        esc(list.date) + '">' +
                "</div>" +
                '<div class="f">' +
                    '<label for="listStore">Tempat belanja</label>' +
                    '<input id="listStore" name="store" maxlength="100" value="' +
                        esc(list.store) + '" placeholder="Supermarket">' +
                "</div>" +
            "</div>" +
            '<div class="f">' +
                '<label for="listNote">Catatan</label>' +
                '<textarea id="listNote" name="note" maxlength="1000" rows="3" ' +
                    'placeholder="Catatan tambahan">' +
                    esc(list.note) +
                "</textarea>" +
            "</div>" +
            '<div class="err" id="listError" role="alert"></div>' +
            '<div class="acts">' +
                '<button type="button" class="btn alt" id="listCancel">Batal</button>' +
                '<button type="submit" class="btn">' + icon("check") + " Simpan</button>" +
            "</div>" +
        "</form>"
    );

    document.getElementById("listCancel").onclick = closeModal;

    document.getElementById("listForm").onsubmit = event => {
        event.preventDefault();

        const form = event.currentTarget;
        const name = form.elements.namedItem("name").value.trim();
        const date = form.elements.namedItem("date").value;

        if (!name || !date) {
            document.getElementById("listError").textContent =
                "Nama daftar dan tanggal wajib diisi.";
            return;
        }

        if (existing) {
            existing.name = name;
            existing.date = date;
            existing.store = form.elements.namedItem("store").value.trim();
            existing.note = form.elements.namedItem("note").value.trim();

            toast("Daftar berhasil diperbarui.");
        } else {
            const newList = {
                id: uid(),
                name,
                date,
                store: form.elements.namedItem("store").value.trim(),
                note: form.elements.namedItem("note").value.trim(),
                items: []
            };

            db.lists.push(newList);
            state.openId = newList.id;
            state.page = "detail";

            toast("Daftar berhasil dibuat.");
        }

        if (save()) {
            closeModal();
            render();
        }
    };

    document.getElementById("listName").focus();
}

/* =========================================
   SHOPPING ITEM FORM
   ========================================= */

function itemForm(listId, itemId = null) {
    const list = find(listId);

    if (!list) {
        toast("Daftar tidak ditemukan.");
        return;
    }

    const existing = itemId
        ? list.items.find(item => item.id === itemId)
        : null;

    if (itemId && !existing) {
        toast("Barang tidak ditemukan.");
        return;
    }

    const item = existing || {
        name: "",
        cat: CATEGORIES[0],
        price: "",
        qty: 1,
        note: ""
    };

    const options = CATEGORIES.map(category =>
        '<option value="' + esc(category) + '"' +
        (category === item.cat ? " selected" : "") + ">" +
        esc(category) + "</option>"
    ).join("");

    openModal(
        "<h3>" + (itemId ? "Edit Barang" : "Tambah Barang") + "</h3>" +
        '<form id="itemForm">' +
            '<div class="f">' +
                '<label for="itemName">Nama barang *</label>' +
                '<input id="itemName" name="name" required maxlength="150" value="' +
                    esc(item.name) + '" placeholder="Nama barang">' +
            "</div>" +
            '<div class="f">' +
                '<label for="itemCategory">Kategori</label>' +
                '<select id="itemCategory" name="cat">' + options + "</select>" +
            "</div>" +
            '<div class="two">' +
                '<div class="f">' +
                    '<label for="itemPrice">Harga satuan (Rp) *</label>' +
                    '<input id="itemPrice" type="number" name="price" min="0" ' +
                        'step="any" required value="' + esc(item.price) + '">' +
                "</div>" +
                '<div class="f">' +
                    '<label for="itemQty">Jumlah *</label>' +
                    '<input id="itemQty" type="number" name="qty" min="1" step="1" ' +
                        'required value="' + esc(item.qty) + '">' +
                "</div>" +
            "</div>" +
            '<div class="f">' +
                '<label for="itemNote">Catatan</label>' +
                '<input id="itemNote" name="note" maxlength="500" value="' +
                    esc(item.note) + '" placeholder="Opsional">' +
            "</div>" +
            '<div class="err" id="itemError" role="alert"></div>' +
            '<div class="acts">' +
                '<button type="button" class="btn alt" id="itemCancel">Batal</button>' +
                '<button type="submit" class="btn">' + icon("check") + " Simpan</button>" +
            "</div>" +
        "</form>"
    );

    document.getElementById("itemCancel").onclick = closeModal;

    document.getElementById("itemForm").onsubmit = event => {
        event.preventDefault();

        const form = event.currentTarget;
        const name = form.elements.namedItem("name").value.trim();
        const category = form.elements.namedItem("cat").value;
        const price = Number(form.elements.namedItem("price").value);
        const quantity = Number(form.elements.namedItem("qty").value);
        const note = form.elements.namedItem("note").value.trim();
        const error = document.getElementById("itemError");

        if (!name) {
            error.textContent = "Nama barang wajib diisi.";
            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            error.textContent = "Harga harus berupa angka nol atau lebih.";
            return;
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            error.textContent = "Jumlah harus berupa bilangan bulat minimal satu.";
            return;
        }

        if (existing) {
            existing.name = name;
            existing.cat = category;
            existing.price = price;
            existing.qty = quantity;
            existing.note = note;

            toast("Barang berhasil diperbarui.");
        } else {
            list.items.push({
                id: uid(),
                name,
                cat: category,
                price,
                qty: quantity,
                note,
                done: false
            });

            toast("Barang berhasil ditambahkan.");
        }

        if (save()) {
            closeModal();
            render();
        }
    };

    document.getElementById("itemName").focus();
}

/* =========================================
   SHOPPING DATA ACTIONS
   ========================================= */

function toggle(listId, itemId) {
    const list = find(listId);
    if (!list) return;

    const item = list.items.find(entry => entry.id === itemId);
    if (!item) return;

    item.done = !item.done;

    if (save()) render();
}

function delItem(listId, itemId) {
    confirmBox("Apakah Anda yakin ingin menghapus barang ini?", () => {
        const list = find(listId);
        if (!list) return;

        list.items = list.items.filter(item => item.id !== itemId);

        if (save()) {
            toast("Barang berhasil dihapus.");
            render();
        }
    });
}

function delList(listId) {
    confirmBox(
        "Daftar belanja dan seluruh barang di dalamnya akan dihapus.",
        () => {
            db.lists = db.lists.filter(list => list.id !== listId);

            if (save()) {
                toast("Daftar belanja berhasil dihapus.");
                go("lists");
            }
        }
    );
}

function copyList(listId) {
    const original = find(listId);
    if (!original) return;

    const copy = JSON.parse(JSON.stringify(original));

    copy.id = uid();
    copy.name = original.name + " (Salinan)";
    copy.date = today();

    copy.items = copy.items.map(item => ({
        ...item,
        id: uid(),
        done: false
    }));

    db.lists.push(copy);

    if (save()) {
        toast("Daftar berhasil disalin.");
        go("detail", copy.id);
    }
}

/* =========================================
   REUSABLE VIEW COMPONENTS
   ========================================= */

function emptyBox(message) {
    return '<div class="card empty">' +
        '<div class="em">' + icon("basket") + "</div>" +
        "<p>" + esc(message) + "</p>" +
        '<button class="btn" type="button" onclick="listForm()">' +
            icon("plus") + " Buat Daftar Belanja" +
        "</button>" +
    "</div>";
}

function listCard(list) {
    const summary = stats(list);
    const complete = summary.n > 0 && summary.pct === 100;

    return '<article class="card list-card" role="button" tabindex="0" ' +
        'onclick="go(\'detail\',\'' + esc(list.id) + '\')" ' +
        'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();go(\'detail\',\'' +
            esc(list.id) + '\')}">' +
        '<div class="row" style="justify-content:space-between">' +
            "<h3>" + esc(list.name) + "</h3>" +
            '<span class="tag' + (complete ? " ok" : "") + '">' +
                (complete ? "Selesai" : "Berjalan") +
            "</span>" +
        "</div>" +
        '<div class="sub">' + fdate(list.date) +
            (list.store ? " · " + esc(list.store) : "") +
        "</div>" +
        '<div class="bar"><i style="width:' + summary.pct + '%"></i></div>' +
        '<div class="sub">' + summary.done + "/" + summary.n +
            " barang selesai · " + summary.pct + "%</div>" +
        '<div style="margin-top:12px;font-size:15px;font-weight:800">' +
            rp(summary.total) +
        "</div>" +
    "</article>";
}

/* =========================================
   DASHBOARD VIEW
   ========================================= */

function vDash() {
    const totals = { n: 0, done: 0, total: 0 };

    db.lists.forEach(list => {
        const summary = stats(list);
        totals.n += summary.n;
        totals.done += summary.done;
        totals.total += summary.total;
    });

    const hour = new Date().getHours();
    const greeting = hour < 11
        ? "Selamat pagi"
        : hour < 15
            ? "Selamat siang"
            : hour < 18
                ? "Selamat sore"
                : "Selamat malam";

    const recent = db.lists.slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3);

    return '<section class="top">' +
        "<div>" +
            "<h1>" + greeting + "</h1>" +
            '<div class="sub">' +
                new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }) +
            "</div>" +
        "</div>" +
        '<button class="btn" type="button" onclick="listForm()">' +
            icon("plus") + " Buat Daftar Belanja" +
        "</button>" +
    "</section>" +

    '<section class="grid" aria-label="Statistik belanja">' +
        '<div class="card stat"><span>Daftar belanja</span><b>' +
            db.lists.length + "</b></div>" +
        '<div class="card stat"><span>Total barang</span><b>' +
            totals.n + "</b></div>" +
        '<div class="card stat"><span>Sudah di troli</span><b>' +
            totals.done + "</b></div>" +
        '<div class="card stat"><span>Belum di troli</span><b>' +
            (totals.n - totals.done) + "</b></div>" +
        '<div class="card stat dark"><span>Total estimasi belanja</span><b>' +
            rp(totals.total) + "</b></div>" +
    "</section>" +

    '<section aria-labelledby="recentTitle">' +
        '<div class="top">' +
            "<h2 id=\"recentTitle\">Daftar Terbaru</h2>" +
            (recent.length
                ? '<button class="btn alt sm" type="button" onclick="go(\'lists\')">Lihat semua</button>'
                : "") +
        "</div>" +
        (recent.length
            ? '<div class="lists">' + recent.map(listCard).join("") + "</div>"
            : emptyBox("Belum ada daftar belanja. Buat daftar pertama Anda.")) +
    "</section>";
}

/* =========================================
   SHOPPING LISTS VIEW
   ========================================= */

function vLists() {
    const lists = db.lists.slice()
        .sort((a, b) => b.date.localeCompare(a.date));

    return '<section class="top">' +
        "<div>" +
            "<h1>Daftar Belanja</h1>" +
            '<div class="sub">Kelola seluruh daftar dan kebutuhan belanja.</div>' +
        "</div>" +
        '<button class="btn" type="button" onclick="listForm()">' +
            icon("plus") + " Tambah Daftar" +
        "</button>" +
    "</section>" +
    (lists.length
        ? '<div class="lists">' + lists.map(listCard).join("") + "</div>"
        : emptyBox("Belum ada daftar belanja."));
}

/* =========================================
   SHOPPING ITEM ROW
   ========================================= */

function itemRow(list, item) {
    return '<div class="item' + (item.done ? " done" : "") + '">' +
        '<input type="checkbox" class="chk" aria-label="Tandai ' +
            esc(item.name) + '" ' + (item.done ? "checked " : "") +
            'onchange="toggle(\'' + esc(list.id) + "','" + esc(item.id) + '\')">' +
        '<div class="info">' +
            '<div class="nm">' + esc(item.name) + "</div>" +
            '<div class="cat">' + esc(item.cat) +
                (item.note ? " · " + esc(item.note) : "") +
            "</div>" +
        "</div>" +
        '<div class="price">' +
            esc(item.qty) + " × " + rp(item.price) +
            "<br><b>" + rp(sub(item)) + "</b>" +
        "</div>" +
        '<div class="row">' +
            '<button class="btn alt sm" type="button" aria-label="Edit barang" ' +
                'title="Edit barang" onclick="itemForm(\'' + esc(list.id) +
                "','" + esc(item.id) + '\')">' + icon("edit") + "</button>" +
            '<button class="btn alt sm" type="button" aria-label="Hapus barang" ' +
                'title="Hapus barang" onclick="delItem(\'' + esc(list.id) +
                "','" + esc(item.id) + '\')">' + icon("trash") + "</button>" +
        "</div>" +
    "</div>";
}

/* =========================================
   SHOPPING LIST DETAIL VIEW
   ========================================= */

function vDetail() {
    const list = find(state.openId);

    if (!list) return vLists();

    const summary = stats(list);
    const todo = list.items.filter(item => !item.done);
    const done = list.items.filter(item => item.done);

    return '<button class="btn alt sm" type="button" onclick="go(\'lists\')">' +
        icon("back") + " Kembali ke Daftar" +
    "</button>" +

    '<section class="top" style="margin-top:24px">' +
        "<div>" +
            "<h1>" + esc(list.name) + "</h1>" +
            '<div class="sub">' + fdate(list.date) +
                (list.store ? " · " + esc(list.store) : "") +
            "</div>" +
            (list.note
                ? '<div class="sub">' + esc(list.note) + "</div>"
                : "") +
        "</div>" +
        '<div class="row" style="flex-wrap:wrap">' +
            '<button class="btn alt sm" type="button" onclick="listForm(\'' +
                esc(list.id) + '\')">' + icon("edit") + " Edit" + "</button>" +
            '<button class="btn alt sm" type="button" onclick="copyList(\'' +
                esc(list.id) + '\')">' + icon("copy") + " Salin" + "</button>" +
            '<button class="btn del sm" type="button" onclick="delList(\'' +
                esc(list.id) + '\')">' + icon("trash") + " Hapus" + "</button>" +
        "</div>" +
    "</section>" +

    '<section class="card detail-summary">' +
        '<div class="row" style="justify-content:space-between">' +
            "<b>Progres belanja</b><b>" + summary.pct + "%</b>" +
        "</div>" +
        '<div class="bar"><i style="width:' + summary.pct + '%"></i></div>' +
        '<div class="grid">' +
            '<div><span class="sub">Total barang</span><br><b>' +
                summary.n + "</b></div>" +
            '<div><span class="sub">Sudah di troli</span><br><b>' +
                summary.done + "</b></div>" +
            '<div><span class="sub">Belum di troli</span><br><b>' +
                summary.left + "</b></div>" +
            '<div><span class="sub">Total estimasi</span><br><b>' +
                rp(summary.total) + "</b></div>" +
            '<div><span class="sub">Harga di troli</span><br><b>' +
                rp(summary.doneTotal) + "</b></div>" +
            '<div><span class="sub">Sisa estimasi</span><br><b>' +
                rp(summary.leftTotal) + "</b></div>" +
        "</div>" +
    "</section>" +

    '<button class="btn" type="button" onclick="itemForm(\'' +
        esc(list.id) + '\')">' + icon("plus") + " Tambah Barang" + "</button>" +

    '<h3 class="sec">Belum Masuk Troli (' + todo.length + ")</h3>" +
    '<section class="card">' +
        (todo.length
            ? todo.map(item => itemRow(list, item)).join("")
            : '<p class="sub">Semua barang sudah dicentang.</p>') +
    "</section>" +

    '<h3 class="sec">Sudah Masuk Troli (' + done.length + ")</h3>" +
    '<section class="card">' +
        (done.length
            ? done.map(item => itemRow(list, item)).join("")
            : '<p class="sub">Belum ada barang yang dicentang.</p>') +
    "</section>";
}

/* =========================================
   HISTORY VIEW
   ========================================= */

function vHist() {
    const query = state.q.toLowerCase();

    const lists = db.lists.filter(list => {
        const name = String(list.name || "").toLowerCase();
        const store = String(list.store || "").toLowerCase();

        return (!query || name.includes(query) || store.includes(query)) &&
            (!state.from || list.date >= state.from) &&
            (!state.to || list.date <= state.to);
    }).sort((a, b) => b.date.localeCompare(a.date));

    const rows = lists.map(list => {
        const summary = stats(list);
        const complete = summary.n > 0 && summary.pct === 100;

        return "<tr>" +
            '<td><button type="button" class="history-link" onclick="go(\'detail\',\'' +
                esc(list.id) + '\')">' + esc(list.name) + "</button></td>" +
            "<td>" + fdate(list.date) + "</td>" +
            "<td>" + esc(list.store || "-") + "</td>" +
            "<td>" + summary.n + "</td>" +
            "<td>" + rp(summary.total) + "</td>" +
            '<td><span class="tag' + (complete ? " ok" : "") + '">' +
                (complete ? "Selesai" : summary.pct + "%") +
            "</span></td>" +
        "</tr>";
    }).join("");

    return '<section class="top">' +
        "<div>" +
            "<h1>Riwayat Belanja</h1>" +
            '<div class="sub">Cari daftar dan saring berdasarkan tanggal.</div>' +
        "</div>" +
    "</section>" +

    '<section class="filters" aria-label="Filter riwayat">' +
        '<input id="historyQuery" type="search" placeholder="Cari nama daftar atau toko" value="' +
            esc(state.q) + '" aria-label="Cari nama daftar atau toko">' +
        '<input id="historyFrom" type="date" value="' + esc(state.from) +
            '" aria-label="Tanggal mulai" title="Dari tanggal">' +
        '<input id="historyTo" type="date" value="' + esc(state.to) +
            '" aria-label="Tanggal akhir" title="Sampai tanggal">' +
        '<button class="btn alt" id="historyReset" type="button">Reset</button>' +
    "</section>" +

    (lists.length
        ? '<section class="card tw"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
            "<thead><tr>" +
                "<th>Daftar</th><th>Tanggal</th><th>Toko</th>" +
                "<th>Barang</th><th>Total</th><th>Status</th>" +
            "</tr></thead>" +
            "<tbody>" + rows + "</tbody>" +
        "</table></section>"
        : '<section class="card empty"><div class="em">' + icon("clock") +
            "</div><p>Tidak ada riwayat yang cocok dengan filter.</p></section>");
}

/* =========================================
   SETTINGS AND THEME CUSTOMIZATION
   ========================================= */

function vSettings() {
    const activeTheme = document.documentElement.dataset.theme || DEFAULT_THEME;

    const cards = THEMES.map(theme => {
        const active = theme.id === activeTheme;

        return '<button type="button" class="theme-card' +
            (active ? " active" : "") +
            '" data-theme-choice="' + esc(theme.id) + '"' +
            ' aria-pressed="' + active + '">' +
            '<div class="theme-card-head">' +
                '<span class="theme-card-title">' + esc(theme.name) + "</span>" +
                (active
                    ? '<span class="theme-status">' + icon("check") + " Aktif</span>"
                    : '<span class="theme-status theme-status-placeholder">' +
                        icon("check") + " Aktif</span>") +
            "</div>" +
            '<div class="theme-card-description">' + esc(theme.description) + "</div>" +
            '<div class="swatches" aria-label="Pratinjau warna">' +
                theme.colors.map((color, index) =>
                    '<span class="swatch" title="' + esc(color) +
                    '" style="background:' + esc(color) +
                    '" aria-label="Warna ' + (index + 1) + '"></span>'
                ).join("") +
            "</div>" +
        "</button>";
    }).join("");

    return '<section class="top">' +
        "<div>" +
            "<h1>Settings</h1>" +
            '<div class="sub">Sesuaikan tampilan aplikasi dengan preferensi Anda.</div>' +
        "</div>" +
    "</section>" +

    '<section aria-labelledby="themeHeading">' +
        "<h2 id=\"themeHeading\">Theme Customization</h2>" +
        '<p class="theme-intro">Pilih tema untuk mengubah warna latar, kartu, tombol, teks, dan elemen antarmuka. Pilihan akan tersimpan otomatis.</p>' +
        '<div class="theme-grid">' + cards + "</div>" +
    "</section>" +

    '<section class="settings-section">' +
        "<h2>Tema awal</h2>" +
        '<p class="settings-note">Gunakan Cherry Blossom untuk kembali ke palet warna asli aplikasi.</p>' +
        '<div style="margin-top:14px">' +
            '<button class="btn alt" type="button" id="resetTheme">' +
                icon("palette") + " Kembalikan Tema Awal" +
            "</button>" +
        "</div>" +
    "</section>";
}

/* =========================================
   RENDER AND EVENT BINDING
   ========================================= */

function bindHistoryEvents() {
    const queryInput = document.getElementById("historyQuery");
    const fromInput = document.getElementById("historyFrom");
    const toInput = document.getElementById("historyTo");
    const resetButton = document.getElementById("historyReset");

    if (queryInput) {
        queryInput.addEventListener("input", () => {
            const cursor = queryInput.selectionStart;
            state.q = queryInput.value;

            const start = queryInput.selectionStart;
            const end = queryInput.selectionEnd;

            render();

            const nextInput = document.getElementById("historyQuery");
            nextInput.focus();
            nextInput.setSelectionRange(
                start == null ? cursor : start,
                end == null ? cursor : end
            );
        });
    }

    if (fromInput) {
        fromInput.addEventListener("change", () => {
            state.from = fromInput.value;
            render();
        });
    }

    if (toInput) {
        toInput.addEventListener("change", () => {
            state.to = toInput.value;
            render();
        });
    }

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            state.q = "";
            state.from = "";
            state.to = "";
            render();
        });
    }
}

function bindSettingsEvents() {
    document.querySelectorAll("[data-theme-choice]").forEach(button => {
        button.addEventListener("click", () => {
            applyTheme(button.dataset.themeChoice, true);
        });
    });

    const resetButton = document.getElementById("resetTheme");

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            applyTheme(DEFAULT_THEME, true);
        });
    }
}

function render() {
    const view = document.getElementById("view");
    const page = state.page;

    const views = {
        dash: vDash,
        lists: vLists,
        detail: vDetail,
        hist: vHist,
        settings: vSettings
    };

    const renderView = views[page] || vDash;
    view.innerHTML = renderView();

    document.querySelectorAll(".nav").forEach(button => {
        const selectedPage = page === "detail" ? "lists" : page;

        button.classList.toggle("on", button.dataset.p === selectedPage);

        if (button.dataset.p === selectedPage) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    if (page === "hist") bindHistoryEvents();
    if (page === "settings") bindSettingsEvents();
}

/* =========================================
   APPLICATION INITIALIZATION
   ========================================= */

function init() {
    loadData();

    const theme = loadTheme();
    applyTheme(theme);

    document.querySelectorAll(".nav").forEach(button => {
        button.addEventListener("click", () => {
            go(button.dataset.p);
        });
    });

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });

        document.addEventListener("click", event => {
            if (
                window.innerWidth <= 760 &&
                sidebar.classList.contains("open") &&
                !sidebar.contains(event.target) &&
                !menuToggle.contains(event.target)
            ) {
                sidebar.classList.remove("open");
            }
        });
    }

    render();
}

document.addEventListener("DOMContentLoaded", init);
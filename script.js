var KEY = "myShoppingList.v1";

var CATS = [
    "Makanan dan Minuman",
    "Kebutuhan Dapur",
    "Perlengkapan Mandi",
    "Perawatan Tubuh",
    "Perlengkapan Rumah",
    "Kebutuhan Pribadi",
    "Lainnya"
];

var db = {
    lists: []
};

var state = {
    page: "dash",
    openId: null,
    q: "",
    from: "",
    to: ""
};

// Memuat data dari localStorage
try {
    var raw = localStorage.getItem(KEY);

    if (raw) {
        db = JSON.parse(raw);
    }
} catch (e) {
    console.log("Data belum tersedia.");
}

function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {
        console.log("Data gagal disimpan.");
    }
}

function uid() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 7);
}

function today() {
    var d = new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

// Fungsi bantuan
function rp(n) {
    return "Rp" + Math.round(n).toLocaleString("id-ID");
}

function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c];
    });
}

function fdate(s) {
    if (!s) {
        return "-";
    }

    var d = new Date(s + "T00:00:00");

    return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function sub(item) {
    return item.price * item.qty;
}

function stats(list) {
    var result = {
        n: list.items.length,
        done: 0,
        total: 0,
        doneTotal: 0
    };

    list.items.forEach(function (item) {
        result.total += sub(item);

        if (item.done) {
            result.done++;
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
    var t = document.getElementById("toast");

    t.textContent = message;
    t.className = "show";

    clearTimeout(toast.t);

    toast.t = setTimeout(function () {
        t.className = "";
    }, 2200);
}

function find(id) {
    return db.lists.filter(function (list) {
        return list.id === id;
    })[0];
}

function go(page, id) {
    state.page = page;
    state.openId = id || null;

    render();
    window.scrollTo(0, 0);
}

// Modal
function closeModal() {
    document.getElementById("modal").innerHTML = "";
}

function openModal(html) {
    document.getElementById("modal").innerHTML =
        '<div class="modal"><div class="box">' +
        html +
        "</div></div>";
}

function confirmBox(message, callback) {
    openModal(
        "<h3>Konfirmasi</h3>" +
        "<p>" + esc(message) + "</p>" +
        '<div class="acts">' +
        '<button class="btn alt" id="cn">Batal</button>' +
        '<button class="btn del" id="cy">Hapus</button>' +
        "</div>"
    );

    document.getElementById("cn").onclick = closeModal;

    document.getElementById("cy").onclick = function () {
        closeModal();
        callback();
    };
}

// Form daftar belanja
function listForm(id) {
    var list = id ? find(id) : {
        name: "",
        date: today(),
        store: "",
        note: ""
    };

    openModal(
        "<h3>" + (id ? "Edit" : "Buat") +
        " Daftar Belanja</h3><br>" +

        '<form id="lf">' +
            '<div class="f">' +
                "<label>Nama daftar *</label>" +
                '<input name="name" value="' + esc(list.name) +
                '" placeholder="Belanja Bulanan">' +
            "</div>" +

            '<div class="two">' +
                '<div class="f">' +
                    "<label>Tanggal belanja *</label>" +
                    '<input type="date" name="date" value="' +
                    esc(list.date) + '">' +
                "</div>" +

                '<div class="f">' +
                    "<label>Tempat (opsional)</label>" +
                    '<input name="store" value="' +
                    esc(list.store) + '" placeholder="Supermarket">' +
                "</div>" +
            "</div>" +

            '<div class="f">' +
                "<label>Catatan (opsional)</label>" +
                '<textarea name="note" rows="2">' +
                esc(list.note) + "</textarea>" +
            "</div>" +

            '<div class="err" id="er"></div>' +

            '<div class="acts">' +
                '<button type="button" class="btn alt" id="cn">' +
                "Batal</button>" +
                '<button class="btn" type="submit">Simpan</button>' +
            "</div>" +
        "</form>"
    );

    document.getElementById("cn").onclick = closeModal;

    document.getElementById("lf").onsubmit = function (e) {
        e.preventDefault();

        var form = e.target;
        var name = form.name.value.trim();
        var date = form.date.value;

        if (!name || !date) {
            document.getElementById("er").textContent =
                "Nama dan tanggal wajib diisi.";
            return;
        }

        if (id) {
            list.name = name;
            list.date = date;
            list.store = form.store.value.trim();
            list.note = form.note.value.trim();

            toast("Daftar diperbarui");
        } else {
            var newList = {
                id: uid(),
                name: name,
                date: date,
                store: form.store.value.trim(),
                note: form.note.value.trim(),
                items: []
            };

            db.lists.push(newList);

            state.openId = newList.id;
            state.page = "detail";

            toast("Daftar dibuat");
        }

        save();
        closeModal();
        render();
    };
}

// Form barang
function itemForm(listId, itemId) {
    var list = find(listId);

    var item = itemId
        ? list.items.filter(function (x) {
            return x.id === itemId;
        })[0]
        : {
            name: "",
            cat: CATS[0],
            price: "",
            qty: 1,
            note: ""
        };

    var options = CATS.map(function (category) {
        return "<option" +
            (category === item.cat ? " selected" : "") +
            ">" + category + "</option>";
    }).join("");

    openModal(
        "<h3>" + (itemId ? "Edit" : "Tambah") +
        " Barang</h3><br>" +

        '<form id="if">' +
            '<div class="f">' +
                "<label>Nama barang *</label>" +
                '<input name="name" value="' + esc(item.name) + '">' +
            "</div>" +

            '<div class="f">' +
                "<label>Kategori</label>" +
                '<select name="cat">' + options + "</select>" +
            "</div>" +

            '<div class="two">' +
                '<div class="f">' +
                    "<label>Harga satuan (Rp) *</label>" +
                    '<input type="number" name="price" min="0" ' +
                    'step="any" inputmode="numeric" value="' +
                    esc(item.price) + '">' +
                "</div>" +

                '<div class="f">' +
                    "<label>Jumlah *</label>" +
                    '<input type="number" name="qty" min="1" ' +
                    'step="1" inputmode="numeric" value="' +
                    esc(item.qty) + '">' +
                "</div>" +
            "</div>" +

            '<div class="f">' +
                "<label>Catatan (opsional)</label>" +
                '<input name="note" value="' + esc(item.note) + '">' +
            "</div>" +

            '<div class="err" id="er"></div>' +

            '<div class="acts">' +
                '<button type="button" class="btn alt" id="cn">' +
                "Batal</button>" +
                '<button class="btn" type="submit">Simpan</button>' +
            "</div>" +
        "</form>"
    );

    document.getElementById("cn").onclick = closeModal;

    document.getElementById("if").onsubmit = function (e) {
        e.preventDefault();

        var form = e.target;
        var name = form.name.value.trim();
        var price = parseFloat(form.price.value);
        var qty = parseInt(form.qty.value, 10);
        var error = document.getElementById("er");

        if (!name) {
            error.textContent = "Nama barang wajib diisi.";
            return;
        }

        if (isNaN(price) || price < 0) {
            error.textContent =
                "Harga tidak boleh kosong atau negatif.";
            return;
        }

        if (isNaN(qty) || qty < 1) {
            error.textContent = "Jumlah harus lebih dari nol.";
            return;
        }

        if (itemId) {
            item.name = name;
            item.cat = form.cat.value;
            item.price = price;
            item.qty = qty;
            item.note = form.note.value.trim();

            toast("Barang diperbarui");
        } else {
            list.items.push({
                id: uid(),
                name: name,
                cat: form.cat.value,
                price: price,
                qty: qty,
                note: form.note.value.trim(),
                done: false
            });

            toast("Barang ditambahkan");
        }

        save();
        closeModal();
        render();
    };
}

// Aksi barang dan daftar
function toggle(listId, itemId) {
    var item = find(listId).items.filter(function (x) {
        return x.id === itemId;
    })[0];

    item.done = !item.done;

    save();
    render();
}

function delItem(listId, itemId) {
    confirmBox("Hapus barang ini?", function () {
        var list = find(listId);

        list.items = list.items.filter(function (item) {
            return item.id !== itemId;
        });

        save();
        toast("Barang dihapus");
        render();
    });
}

function delList(listId) {
    confirmBox(
        "Hapus daftar belanja beserta semua barangnya?",
        function () {
            db.lists = db.lists.filter(function (list) {
                return list.id !== listId;
            });

            save();
            toast("Daftar dihapus");
            go("lists");
        }
    );
}

function copyList(listId) {
    var list = find(listId);
    var newList = JSON.parse(JSON.stringify(list));

    newList.id = uid();
    newList.name = list.name + " (Salinan)";
    newList.date = today();

    newList.items.forEach(function (item) {
        item.id = uid();
        item.done = false;
    });

    db.lists.push(newList);

    save();
    toast("Daftar disalin");
    go("detail", newList.id);
}

// Kartu daftar belanja
function listCard(list) {
    var s = stats(list);
    var isDone = s.n && s.pct === 100;

    return '<div class="card list-card" ' +
        'onclick="go(\'detail\',\'' + list.id + '\')">' +

        '<div class="row" style="justify-content:space-between">' +
            "<h3>" + esc(list.name) + "</h3>" +
            '<span class="tag' + (isDone ? " ok" : "") + '">' +
                (isDone ? "Selesai" : "Berjalan") +
            "</span>" +
        "</div>" +

        '<div class="sub">' + fdate(list.date) +
            (list.store ? " · " + esc(list.store) : "") +
        "</div>" +

        '<div class="bar"><i style="width:' + s.pct + '%"></i></div>' +

        '<div class="sub">' + s.done + "/" + s.n +
        " barang · " + s.pct + "%</div>" +

        '<div style="margin-top:8px"><b>' +
        rp(s.total) + "</b></div>" +

    "</div>";
}

function emptyBox(message) {
    return '<div class="card empty">' +
        '<div class="em">🧺</div>' +
        "<p>" + message + "</p>" +
        '<button class="btn" onclick="listForm()">' +
        "Buat Daftar Belanja</button>" +
    "</div>";
}

// Dashboard
function vDash() {
    var total = {
        n: 0,
        done: 0,
        total: 0
    };

    db.lists.forEach(function (list) {
        var s = stats(list);

        total.n += s.n;
        total.done += s.done;
        total.total += s.total;
    });

    var hour = new Date().getHours();

    var greeting = hour < 11
        ? "Selamat pagi"
        : hour < 15
            ? "Selamat siang"
            : hour < 18
                ? "Selamat sore"
                : "Selamat malam";

    var recent = db.lists.slice()
        .sort(function (a, b) {
            return b.date.localeCompare(a.date);
        })
        .slice(0, 3);

    return '<div class="top">' +
        "<div>" +
            "<h1>" + greeting + " 👋</h1>" +
            '<div class="sub">' +
                new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }) +
            "</div>" +
        "</div>" +

        '<button class="btn" onclick="listForm()">' +
        "＋ Buat Daftar Belanja</button>" +
    "</div>" +

    '<div class="grid">' +
        '<div class="card stat"><span>Daftar belanja</span>' +
        "<b>" + db.lists.length + "</b></div>" +

        '<div class="card stat"><span>Total barang</span>' +
        "<b>" + total.n + "</b></div>" +

        '<div class="card stat"><span>Sudah di troli</span>' +
        "<b>" + total.done + "</b></div>" +

        '<div class="card stat"><span>Belum di troli</span>' +
        "<b>" + (total.n - total.done) + "</b></div>" +

        '<div class="card stat dark"><span>Total estimasi</span>' +
        "<b>" + rp(total.total) + "</b></div>" +
    "</div>" +

    '<h2 style="margin-bottom:12px">Daftar Terbaru</h2>' +

    (recent.length
        ? '<div class="lists">' +
            recent.map(listCard).join("") +
          "</div>"
        : emptyBox("Belum ada daftar belanja. Yuk buat yang pertama!"));
}

// Halaman daftar belanja
function vLists() {
    var lists = db.lists.slice().sort(function (a, b) {
        return b.date.localeCompare(a.date);
    });

    return '<div class="top">' +
        "<div>" +
            "<h1>Daftar Belanja</h1>" +
            '<div class="sub">Semua daftar belanja kamu</div>' +
        "</div>" +

        '<button class="btn" onclick="listForm()">' +
        "＋ Tambah Daftar</button>" +
    "</div>" +

    (lists.length
        ? '<div class="lists">' +
            lists.map(listCard).join("") +
          "</div>"
        : emptyBox("Belum ada daftar belanja."));
}

// Tampilan barang
function itemRow(list, item) {
    return '<div class="item' +
        (item.done ? " done" : "") + '">' +

        '<input type="checkbox" class="chk" ' +
        'aria-label="Tandai ' + esc(item.name) + '"' +
        (item.done ? " checked" : "") +
        ' onchange="toggle(\'' + list.id + "','" +
        item.id + '\')">' +

        '<div class="info">' +
            '<div class="nm">' + esc(item.name) + "</div>" +
            '<div class="cat">' + esc(item.cat) +
                (item.note ? " · " + esc(item.note) : "") +
            "</div>" +
        "</div>" +

        '<div class="price">' +
            item.qty + " × " + rp(item.price) +
            "<br><b>" + rp(sub(item)) + "</b>" +
        "</div>" +

        '<div class="row" style="gap:6px">' +
            '<button class="btn alt sm" aria-label="Edit" ' +
            'onclick="itemForm(\'' + list.id + "','" +
            item.id + '\')">✏️</button>' +

            '<button class="btn alt sm" aria-label="Hapus" ' +
            'onclick="delItem(\'' + list.id + "','" +
            item.id + '\')">🗑️</button>' +
        "</div>" +

    "</div>";
}

// Detail daftar belanja
function vDetail() {
    var list = find(state.openId);

    if (!list) {
        return vLists();
    }

    var s = stats(list);

    var todo = list.items.filter(function (item) {
        return !item.done;
    });

    var done = list.items.filter(function (item) {
        return item.done;
    });

    return '<button class="btn alt sm" onclick="go(\'lists\')">' +
        "← Kembali</button><br><br>" +

        '<div class="top">' +
            "<div>" +
                "<h1>" + esc(list.name) + "</h1>" +

                '<div class="sub">' + fdate(list.date) +
                    (list.store ? " · " + esc(list.store) : "") +
                "</div>" +

                (list.note
                    ? '<div class="sub">📝 ' +
                        esc(list.note) + "</div>"
                    : "") +
            "</div>" +

            '<div class="row" style="flex-wrap:wrap">' +
                '<button class="btn alt sm" onclick="listForm(\'' +
                list.id + '\')">Edit</button>' +

                '<button class="btn alt sm" onclick="copyList(\'' +
                list.id + '\')">Salin</button>' +

                '<button class="btn del sm" onclick="delList(\'' +
                list.id + '\')">Hapus</button>' +
            "</div>" +
        "</div>" +

        '<div class="card" style="margin-bottom:16px">' +
            '<div class="row" style="justify-content:space-between">' +
                "<b>Progres belanja</b>" +
                "<b>" + s.pct + "%</b>" +
            "</div>" +

            '<div class="bar"><i style="width:' +
            s.pct + '%"></i></div>' +

            '<div class="grid" style="margin:12px 0 0">' +
                '<div><span class="sub">Total barang</span><br>' +
                "<b>" + s.n + "</b></div>" +

                '<div><span class="sub">Sudah di troli</span><br>' +
                "<b>" + s.done + "</b></div>" +

                '<div><span class="sub">Belum di troli</span><br>' +
                "<b>" + s.left + "</b></div>" +

                '<div><span class="sub">Total estimasi</span><br>' +
                "<b>" + rp(s.total) + "</b></div>" +

                '<div><span class="sub">Harga di troli</span><br>' +
                "<b>" + rp(s.doneTotal) + "</b></div>" +

                '<div><span class="sub">Sisa estimasi</span><br>' +
                "<b>" + rp(s.leftTotal) + "</b></div>" +
            "</div>" +
        "</div>" +

        '<button class="btn" onclick="itemForm(\'' +
        list.id + '\')">＋ Tambah Barang</button>' +

        '<h3 class="sec">Belum Masuk Troli (' +
        todo.length + ")</h3>" +

        '<div class="card">' +
            (todo.length
                ? todo.map(function (item) {
                    return itemRow(list, item);
                }).join("")
                : '<div class="sub">Tidak ada barang tersisa.</div>') +
        "</div>" +

        '<h3 class="sec">Sudah Masuk Troli (' +
        done.length + ")</h3>" +

        '<div class="card">' +
            (done.length
                ? done.map(function (item) {
                    return itemRow(list, item);
                }).join("")
                : '<div class="sub">Belum ada barang yang dicentang.</div>') +
        "</div>";
}

// Riwayat belanja
function vHist() {
    var q = state.q.toLowerCase();

    var lists = db.lists.filter(function (list) {
        var matchText = !q ||
            list.name.toLowerCase().indexOf(q) > -1 ||
            (list.store || "").toLowerCase().indexOf(q) > -1;

        var matchFrom = !state.from || list.date >= state.from;
        var matchTo = !state.to || list.date <= state.to;

        return matchText && matchFrom && matchTo;
    }).sort(function (a, b) {
        return b.date.localeCompare(a.date);
    });

    var rows = lists.map(function (list) {
        var s = stats(list);
        var isDone = s.n && s.pct === 100;

        return '<tr style="cursor:pointer" onclick="go(\'detail\',\'' +
            list.id + '\')">' +

            "<td>" + esc(list.name) + "</td>" +
            "<td>" + fdate(list.date) + "</td>" +
            "<td>" + esc(list.store || "-") + "</td>" +
            "<td>" + s.n + "</td>" +
            "<td>" + rp(s.total) + "</td>" +

            '<td><span class="tag' + (isDone ? " ok" : "") + '">' +
                (isDone ? "Selesai" : s.pct + "%") +
            "</span></td>" +

        "</tr>";
    }).join("");

    return '<div class="top">' +
        "<div>" +
            "<h1>Riwayat Belanja</h1>" +
            '<div class="sub">Klik baris untuk melihat detail</div>' +
        "</div>" +
    "</div>" +

    '<div class="filters">' +
        '<input id="hq" placeholder="🔍 Cari nama daftar / toko" ' +
        'value="' + esc(state.q) + '">' +

        '<input type="date" id="hf" value="' + state.from +
        '" title="Dari tanggal">' +

        '<input type="date" id="ht" value="' + state.to +
        '" title="Sampai tanggal">' +

        '<button class="btn alt" onclick="state.q=state.from=state.to=\'\';render()">' +
        "Reset</button>" +
    "</div>" +

    (lists.length
        ? '<div class="card tw">' +
            '<table style="width:100%;border-collapse:collapse;font-size:14px">' +
                "<thead>" +
                    '<tr style="text-align:left;color:var(--muted)">' +
                        "<th>Daftar</th>" +
                        "<th>Tanggal</th>" +
                        "<th>Toko</th>" +
                        "<th>Barang</th>" +
                        "<th>Total</th>" +
                        "<th>Status</th>" +
                    "</tr>" +
                "</thead>" +
                "<tbody>" + rows + "</tbody>" +
            "</table>" +
          "</div>"
        : '<div class="card empty">' +
            '<div class="em">🕘</div>' +
            "<p>Tidak ada riwayat yang cocok.</p>" +
          "</div>");
}

// Menampilkan halaman
function render() {
    var page = state.page;
    var view = document.getElementById("view");

    if (page === "dash") {
        view.innerHTML = vDash();
    } else if (page === "lists") {
        view.innerHTML = vLists();
    } else if (page === "detail") {
        view.innerHTML = vDetail();
    } else {
        view.innerHTML = vHist();
    }

    document.querySelectorAll(".nav").forEach(function (button) {
        var activePage = page === "detail" ? "lists" : page;

        button.classList.toggle(
            "on",
            button.dataset.p === activePage
        );
    });

    if (page === "hist") {
        var q = document.getElementById("hq");

        q.oninput = function () {
            state.q = q.value;

            var pos = q.selectionStart;

            render();

            var newInput = document.getElementById("hq");

            newInput.focus();
            newInput.setSelectionRange(pos, pos);
        };

        document.getElementById("hf").onchange = function (e) {
            state.from = e.target.value;
            render();
        };

        document.getElementById("ht").onchange = function (e) {
            state.to = e.target.value;
            render();
        };
    }
}

// Navigasi menu
document.querySelectorAll(".nav").forEach(function (button) {
    button.onclick = function () {
        go(button.dataset.p);
    };
});

render();
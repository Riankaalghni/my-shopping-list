var KEY = 'myShoppingList.v1';

var CATS = [
    'Makanan dan Minuman',
    'Kebutuhan Dapur',
    'Perlengkapan Mandi',
    'Perawatan Tubuh',
    'Perlengkapan Rumah',
    'Kebutuhan Pribadi',
    'Lainnya'
];

var db = {
    lists: []
};

var state = {
    page: 'dash',
    openId: null,
    q: '',
    from: '',
    to: ''
};

// Mengambil data dari localStorage
try {
    var raw = localStorage.getItem(KEY);

    if (raw) {
        db = JSON.parse(raw);
    }
} catch (e) {
    // Data gagal dibaca
}

// Menyimpan data
function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {
        // Penyimpanan gagal
    }
}

// Membuat ID unik
function uid() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 7);
}

// Mengambil tanggal hari ini
function today() {
    var d = new Date();

    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}


// ========================================
// 2. FUNGSI BANTU
// ========================================

// Format Rupiah
var rp = function (n) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
};

// Mengamankan teks HTML
function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c];
    });
}

// Format tanggal Indonesia
function fdate(s) {
    if (!s) return '-';

    var d = new Date(s + 'T00:00:00');

    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Menghitung subtotal
function sub(i) {
    return i.price * i.qty;
}

// Menghitung statistik belanja
function stats(l) {
    var r = {
        n: l.items.length,
        done: 0,
        total: 0,
        doneTotal: 0
    };

    l.items.forEach(function (i) {
        r.total += sub(i);

        if (i.done) {
            r.done++;
            r.doneTotal += sub(i);
        }
    });

    r.left = r.n - r.done;
    r.leftTotal = r.total - r.doneTotal;
    r.pct = r.n ? Math.round(r.done / r.n * 100) : 0;

    return r;
}

// Menampilkan notifikasi
function toast(m) {
    var t = document.getElementById('toast');

    t.textContent = m;
    t.className = 'show';

    clearTimeout(toast.t);

    toast.t = setTimeout(function () {
        t.className = '';
    }, 2200);
}

// Mencari daftar berdasarkan ID
function find(id) {
    return db.lists.filter(function (l) {
        return l.id === id;
    })[0];
}

// Berpindah halaman
function go(p, id) {
    state.page = p;
    state.openId = id || null;

    render();
    window.scrollTo(0, 0);
}


// ========================================
// 3. MODAL DAN KONFIRMASI
// ========================================

function closeModal() {
    document.getElementById('modal').innerHTML = '';
}

function openModal(html) {
    document.getElementById('modal').innerHTML =
        '<div class="modal">' +
            '<div class="box">' + html + '</div>' +
        '</div>';
}

// Konfirmasi sebelum menghapus
function confirmBox(msg, ok) {
    openModal(
        '<h3>Konfirmasi</h3>' +
        '<p>' + esc(msg) + '</p>' +

        '<div class="acts">' +
            '<button class="btn alt" id="cn">Batal</button>' +
            '<button class="btn del" id="cy">Hapus</button>' +
        '</div>'
    );

    document.getElementById('cn').onclick = closeModal;

    document.getElementById('cy').onclick = function () {
        closeModal();
        ok();
    };
}


// ========================================
// 4. FORM DAFTAR BELANJA
// ========================================

function listForm(id) {
    var l = id ? find(id) : {
        name: '',
        date: today(),
        store: '',
        note: ''
    };

    openModal(
        '<h3>' + (id ? 'Edit' : 'Buat') + ' Daftar Belanja</h3><br>' +

        '<form id="lf">' +

            '<div class="f">' +
                '<label>Nama daftar *</label>' +
                '<input name="name" value="' + esc(l.name) + '" placeholder="Belanja Bulanan">' +
            '</div>' +

            '<div class="two">' +
                '<div class="f">' +
                    '<label>Tanggal belanja *</label>' +
                    '<input type="date" name="date" value="' + esc(l.date) + '">' +
                '</div>' +

                '<div class="f">' +
                    '<label>Tempat (opsional)</label>' +
                    '<input name="store" value="' + esc(l.store) + '" placeholder="Supermarket">' +
                '</div>' +
            '</div>' +

            '<div class="f">' +
                '<label>Catatan (opsional)</label>' +
                '<textarea name="note" rows="2">' + esc(l.note) + '</textarea>' +
            '</div>' +

            '<div class="err" id="er"></div>' +

            '<div class="acts">' +
                '<button type="button" class="btn alt" id="cn">Batal</button>' +
                '<button class="btn" type="submit">Simpan</button>' +
            '</div>' +

        '</form>'
    );

    document.getElementById('cn').onclick = closeModal;

    document.getElementById('lf').onsubmit = function (e) {
        e.preventDefault();

        var f = e.target;
        var name = f.name.value.trim();
        var date = f.date.value;

        if (!name || !date) {
            document.getElementById('er').textContent =
                'Nama dan tanggal wajib diisi.';
            return;
        }

        if (id) {
            l.name = name;
            l.date = date;
            l.store = f.store.value.trim();
            l.note = f.note.value.trim();

            toast('Daftar diperbarui');

        } else {
            var n = {
                id: uid(),
                name: name,
                date: date,
                store: f.store.value.trim(),
                note: f.note.value.trim(),
                items: []
            };

            db.lists.push(n);

            toast('Daftar dibuat');

            state.openId = n.id;
            state.page = 'detail';
        }

        save();
        closeModal();
        render();
    };
}


// ========================================
// 5. FORM BARANG
// ========================================

function itemForm(lid, iid) {
    var l = find(lid);

    var it = iid
        ? l.items.filter(function (x) {
            return x.id === iid;
        })[0]
        : {
            name: '',
            cat: CATS[0],
            price: '',
            qty: 1,
            note: ''
        };

    openModal(
        '<h3>' + (iid ? 'Edit' : 'Tambah') + ' Barang</h3><br>' +

        '<form id="if">' +

            '<div class="f">' +
                '<label>Nama barang *</label>' +
                '<input name="name" value="' + esc(it.name) + '">' +
            '</div>' +

            '<div class="f">' +
                '<label>Kategori</label>' +
                '<select name="cat">' +

                    CATS.map(function (c) {
                        return '<option' +
                            (c === it.cat ? ' selected' : '') +
                            '>' + c + '</option>';
                    }).join('') +

                '</select>' +
            '</div>' +

            '<div class="two">' +
                '<div class="f">' +
                    '<label>Harga satuan (Rp) *</label>' +
                    '<input type="number" name="price" min="0" step="any" inputmode="numeric" value="' + esc(it.price) + '">' +
                '</div>' +

                '<div class="f">' +
                    '<label>Jumlah *</label>' +
                    '<input type="number" name="qty" min="1" step="1" inputmode="numeric" value="' + esc(it.qty) + '">' +
                '</div>' +
            '</div>' +

            '<div class="f">' +
                '<label>Catatan (opsional)</label>' +
                '<input name="note" value="' + esc(it.note) + '">' +
            '</div>' +

            '<div class="err" id="er"></div>' +

            '<div class="acts">' +
                '<button type="button" class="btn alt" id="cn">Batal</button>' +
                '<button class="btn" type="submit">Simpan</button>' +
            '</div>' +

        '</form>'
    );

    document.getElementById('cn').onclick = closeModal;

    document.getElementById('if').onsubmit = function (e) {
        e.preventDefault();

        var f = e.target;

        var name = f.name.value.trim();
        var price = parseFloat(f.price.value);
        var qty = parseInt(f.qty.value, 10);

        var er = document.getElementById('er');

        if (!name) {
            er.textContent = 'Nama barang wajib diisi.';
            return;
        }

        if (isNaN(price) || price < 0) {
            er.textContent = 'Harga tidak boleh kosong atau negatif.';
            return;
        }

        if (isNaN(qty) || qty < 1) {
            er.textContent = 'Jumlah harus lebih dari nol.';
            return;
        }

        if (iid) {
            it.name = name;
            it.cat = f.cat.value;
            it.price = price;
            it.qty = qty;
            it.note = f.note.value.trim();

            toast('Barang diperbarui');

        } else {
            l.items.push({
                id: uid(),
                name: name,
                cat: f.cat.value,
                price: price,
                qty: qty,
                note: f.note.value.trim(),
                done: false
            });

            toast('Barang ditambahkan');
        }

        save();
        closeModal();
        render();
    };
}


// ========================================
// 6. AKSI DATA
// ========================================

// Checklist barang
function toggle(lid, iid) {
    var i = find(lid).items.filter(function (x) {
        return x.id === iid;
    })[0];

    i.done = !i.done;

    save();
    render();
}

// Menghapus barang
function delItem(lid, iid) {
    confirmBox('Hapus barang ini?', function () {
        var l = find(lid);

        l.items = l.items.filter(function (x) {
            return x.id !== iid;
        });

        save();
        toast('Barang dihapus');
        render();
    });
}

// Menghapus daftar
function delList(lid) {
    confirmBox('Hapus daftar belanja beserta semua barangnya?', function () {
        db.lists = db.lists.filter(function (x) {
            return x.id !== lid;
        });

        save();
        toast('Daftar dihapus');
        go('lists');
    });
}

// Menyalin daftar
function copyList(lid) {
    var l = find(lid);
    var n = JSON.parse(JSON.stringify(l));

    n.id = uid();
    n.name = l.name + ' (Salinan)';
    n.date = today();

    n.items.forEach(function (i) {
        i.id = uid();
        i.done = false;
    });

    db.lists.push(n);

    save();
    toast('Daftar disalin');
    go('detail', n.id);
}


// ========================================
// 7. KOMPONEN TAMPILAN
// ========================================

// Kartu daftar belanja
function listCard(l) {
    var s = stats(l);

    return '<div class="card list-card" onclick="go(\\'detail\\',\\'' + l.id + '\\')">' +

        '<div class="row" style="justify-content:space-between">' +
            '<h3>' + esc(l.name) + '</h3>' +

            '<span class="tag' + (s.n && s.pct === 100 ? ' ok' : '') + '">' +
                (s.n && s.pct === 100 ? 'Selesai' : 'Berjalan') +
            '</span>' +
        '</div>' +

        '<div class="sub">' +
            fdate(l.date) +
            (l.store ? ' · ' + esc(l.store) : '') +
        '</div>' +

        '<div class="bar">' +
            '<i style="width:' + s.pct + '%"></i>' +
        '</div>' +

        '<div class="sub">' +
            s.done + '/' + s.n + ' barang · ' + s.pct + '%' +
        '</div>' +

        '<div style="margin-top:8px">' +
            '<b>' + rp(s.total) + '</b>' +
        '</div>' +

    '</div>';
}

// Tampilan jika data kosong
function emptyBox(msg) {
    return '<div class="card empty">' +
        '<div class="em">🧺</div>' +
        '<p>' + msg + '</p>' +
        '<button class="btn" onclick="listForm()">Buat Daftar Belanja</button>' +
    '</div>';
}


// ========================================
// 8. HALAMAN DASHBOARD
// ========================================

function vDash() {
    var tot = {
        n: 0,
        done: 0,
        total: 0
    };

    db.lists.forEach(function (l) {
        var s = stats(l);

        tot.n += s.n;
        tot.done += s.done;
        tot.total += s.total;
    });

    var h = new Date().getHours();

    var g = h < 11
        ? 'Selamat pagi'
        : h < 15
            ? 'Selamat siang'
            : h < 18
                ? 'Selamat sore'
                : 'Selamat malam';

    var recent = db.lists.slice()
        .sort(function (a, b) {
            return b.date.localeCompare(a.date);
        })
        .slice(0, 3);

    return '<div class="top">' +

        '<div>' +
            '<h1>' + g + ' 👋</h1>' +

            '<div class="sub">' +
                new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }) +
            '</div>' +
        '</div>' +

        '<button class="btn" onclick="listForm()">＋ Buat Daftar Belanja</button>' +

    '</div>' +

    '<div class="grid">' +

        '<div class="card stat">' +
            '<span>Daftar belanja</span>' +
            '<b>' + db.lists.length + '</b>' +
        '</div>' +

        '<div class="card stat">' +
            '<span>Total barang</span>' +
            '<b>' + tot.n + '</b>' +
        '</div>' +

        '<div class="card stat">' +
            '<span>Sudah di troli</span>' +
            '<b>' + tot.done + '</b>' +
        '</div>' +

        '<div class="card stat">' +
            '<span>Belum di troli</span>' +
            '<b>' + (tot.n - tot.done) + '</b>' +
        '</div>' +

        '<div class="card stat dark">' +
            '<span>Total estimasi</span>' +
            '<b>' + rp(tot.total) + '</b>' +
        '</div>' +

    '</div>' +

    '<h2 style="margin-bottom:12px">Daftar Terbaru</h2>' +

    (
        recent.length
            ? '<div class="lists">' + recent.map(listCard).join('') + '</div>'
            : emptyBox('Belum ada daftar belanja. Yuk buat yang pertama!')
    );
}


// ========================================
// 9. HALAMAN DAFTAR BELANJA
// ========================================

function vLists() {
    var ls = db.lists.slice().sort(function (a, b) {
        return b.date.localeCompare(a.date);
    });

    return '<div class="top">' +

        '<div>' +
            '<h1>Daftar Belanja</h1>' +
            '<div class="sub">Semua daftar belanja kamu</div>' +
        '</div>' +

        '<button class="btn" onclick="listForm()">＋ Tambah Daftar</button>' +

    '</div>' +

    (
        ls.length
            ? '<div class="lists">' + ls.map(listCard).join('') + '</div>'
            : emptyBox('Belum ada daftar belanja.')
    );
}


// ========================================
// 10. BARIS ITEM BARANG
// ========================================

function itemRow(l, i) {
    return '<div class="item' + (i.done ? ' done' : '') + '">' +

        '<input type="checkbox" class="chk" aria-label="Tandai ' + esc(i.name) + '"' +
            (i.done ? ' checked' : '') +
            ' onchange="toggle(\\'' + l.id + '\\',\\'' + i.id + '\\')">' +

        '<div class="info">' +
            '<div class="nm">' + esc(i.name) + '</div>' +

            '<div class="cat">' +
                esc(i.cat) +
                (i.note ? ' · ' + esc(i.note) : '') +
            '</div>' +
        '</div>' +

        '<div class="price">' +
            i.qty + ' × ' + rp(i.price) +
            '<br><b>' + rp(sub(i)) + '</b>' +
        '</div>' +

        '<div class="row" style="gap:6px">' +
            '<button class="btn alt sm" aria-label="Edit" onclick="itemForm(\\'' + l.id + '\\',\\'' + i.id + '\\')">✏️</button>' +

            '<button class="btn alt sm" aria-label="Hapus" onclick="delItem(\\'' + l.id + '\\',\\'' + i.id + '\\')">🗑️</button>' +
        '</div>' +

    '</div>';
}


// ========================================
// 11. HALAMAN DETAIL
// ========================================

function vDetail() {
    var l = find(state.openId);

    if (!l) {
        return vLists();
    }

    var s = stats(l);

    var todo = l.items.filter(function (i) {
        return !i.done;
    });

    var dn = l.items.filter(function (i) {
        return i.done;
    });

    return '<button class="btn alt sm" onclick="go(\\'lists\\')">← Kembali</button><br><br>' +

        '<div class="top">' +

            '<div>' +
                '<h1>' + esc(l.name) + '</h1>' +

                '<div class="sub">' +
                    fdate(l.date) +
                    (l.store ? ' · ' + esc(l.store) : '') +
                '</div>' +

                (l.note ? '<div class="sub">📝 ' + esc(l.note) + '</div>' : '') +
            '</div>' +

            '<div class="row" style="flex-wrap:wrap">' +
                '<button class="btn alt sm" onclick="listForm(\\'' + l.id + '\\')">Edit</button>' +
                '<button class="btn alt sm" onclick="copyList(\\'' + l.id + '\\')">Salin</button>' +
                '<button class="btn del sm" onclick="delList(\\'' + l.id + '\\')">Hapus</button>' +
            '</div>' +

        '</div>' +

        '<div class="card" style="margin-bottom:16px">' +

            '<div class="row" style="justify-content:space-between">' +
                '<b>Progres belanja</b>' +
                '<b>' + s.pct + '%</b>' +
            '</div>' +

            '<div class="bar">' +
                '<i style="width:' + s.pct + '%"></i>' +
            '</div>' +

            '<div class="grid" style="margin:12px 0 0">' +
                '<div><span class="sub">Total barang</span><br><b>' + s.n + '</b></div>' +
                '<div><span class="sub">Sudah di troli</span><br><b>' + s.done + '</b></div>' +
                '<div><span class="sub">Belum di troli</span><br><b>' + s.left + '</b></div>' +
                '<div><span class="sub">Total estimasi</span><br><b>' + rp(s.total) + '</b></div>' +
                '<div><span class="sub">Harga di troli</span><br><b>' + rp(s.doneTotal) + '</b></div>' +
                '<div><span class="sub">Sisa estimasi</span><br><b>' + rp(s.leftTotal) + '</b></div>' +
            '</div>' +

        '</div>' +

        '<button class="btn" onclick="itemForm(\\'' + l.id + '\\')">＋ Tambah Barang</button>' +

        '<h3 class="sec">Belum Masuk Troli (' + todo.length + ')</h3>' +

        '<div class="card">' +
            (
                todo.length
                    ? todo.map(function (i) {
                        return itemRow(l, i);
                    }).join('')
                    : '<div class="sub">Tidak ada barang tersisa.</div>'
            ) +
        '</div>' +

        '<h3 class="sec">Sudah Masuk Troli (' + dn.length + ')</h3>' +

        '<div class="card">' +
            (
                dn.length
                    ? dn.map(function (i) {
                        return itemRow(l, i);
                    }).join('')
                    : '<div class="sub">Belum ada barang yang dicentang.</div>'
            ) +
        '</div>';
}


// ========================================
// 12. HALAMAN RIWAYAT
// ========================================

function vHist() {
    var q = state.q.toLowerCase();

    var ls = db.lists.filter(function (l) {
        return (
            !q ||
            l.name.toLowerCase().indexOf(q) > -1 ||
            (l.store || '').toLowerCase().indexOf(q) > -1
        ) &&
        (!state.from || l.date >= state.from) &&
        (!state.to || l.date <= state.to);

    }).sort(function (a, b) {
        return b.date.localeCompare(a.date);
    });

    var rows = ls.map(function (l) {
        var s = stats(l);
        var ok = s.n && s.pct === 100;

        return '<tr style="cursor:pointer" onclick="go(\\'detail\\',\\'' + l.id + '\\')">' +

            '<td>' + esc(l.name) + '</td>' +
            '<td>' + fdate(l.date) + '</td>' +
            '<td>' + esc(l.store || '-') + '</td>' +
            '<td>' + s.n + '</td>' +
            '<td>' + rp(s.total) + '</td>' +

            '<td>' +
                '<span class="tag' + (ok ? ' ok' : '') + '">' +
                    (ok ? 'Selesai' : s.pct + '%') +
                '</span>' +
            '</td>' +

        '</tr>';
    }).join('');

    return '<div class="top">' +
        '<div>' +
            '<h1>Riwayat Belanja</h1>' +
            '<div class="sub">Klik baris untuk melihat detail</div>' +
        '</div>' +
    '</div>' +

    '<div class="filters">' +

        '<input id="hq" placeholder="🔍 Cari nama daftar / toko" value="' + esc(state.q) + '">' +

        '<input type="date" id="hf" value="' + state.from + '" title="Dari tanggal">' +

        '<input type="date" id="ht" value="' + state.to + '" title="Sampai tanggal">' +

        '<button class="btn alt" onclick="state.q=state.from=state.to=\\'\\';render()">Reset</button>' +

    '</div>' +

    (
        ls.length
            ? '<div class="card tw">' +

                '<table style="width:100%;border-collapse:collapse;font-size:14px">' +

                    '<thead>' +
                        '<tr style="text-align:left;color:var(--muted)">' +
                            '<th>Daftar</th>' +
                            '<th>Tanggal</th>' +
                            '<th>Toko</th>' +
                            '<th>Barang</th>' +
                            '<th>Total</th>' +
                            '<th>Status</th>' +
                        '</tr>' +
                    '</thead>' +

                    '<tbody>' + rows + '</tbody>' +

                '</table>' +

            '</div>'

            : '<div class="card empty">' +
                '<div class="em">🕘</div>' +
                '<p>Tidak ada riwayat yang cocok.</p>' +
            '</div>'
    );
}


// ========================================
// 13. RENDER DAN NAVIGASI
// ========================================

function render() {
    var p = state.page;
    var v = document.getElementById('view');

    v.innerHTML = p === 'dash'
        ? vDash()
        : p === 'lists'
            ? vLists()
            : p === 'detail'
                ? vDetail()
                : vHist();

    // Mengatur menu aktif
    document.querySelectorAll('.nav').forEach(function (b) {
        b.classList.toggle(
            'on',
            b.dataset.p === (p === 'detail' ? 'lists' : p)
        );
    });

    // Mengaktifkan pencarian dan filter riwayat
    if (p === 'hist') {
        var q = document.getElementById('hq');

        q.oninput = function () {
            state.q = q.value;

            var pos = q.selectionStart;

            render();

            var n = document.getElementById('hq');

            n.focus();
            n.setSelectionRange(pos, pos);
        };

        document.getElementById('hf').onchange = function (e) {
            state.from = e.target.value;
            render();
        };

        document.getElementById('ht').onchange = function (e) {
            state.to = e.target.value;
            render();
        };
    }
}


// ========================================
// 14. INISIALISASI APLIKASI
// ========================================

// Mengatur navigasi
document.querySelectorAll('.nav').forEach(function (b) {
    b.onclick = function () {
        go(b.dataset.p);
    };
});

// Menampilkan halaman pertama
render();
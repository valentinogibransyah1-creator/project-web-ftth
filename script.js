/**
 * FTTH Network Planner & Cost Estimator - Core Business Logic
 * Elektronika Major 2026
 */

// Global State Management
let appState = {
    wilayahMultiplier: 1.0,
    dataStore: {
        tiang: [],
        kabel: [],
        odp: [],
        odc: [],
        rumah: []
    },
    activeMapTool: 'tiang' // Default simulation tool mode
};

// Inisialisasi Aplikasi Saat DOM Selesai Dimuat
document.addEventListener("DOMContentLoaded", () => {
    initHeroAnimation();
    initWilayahHandler();
    initFormHandlers();
    initInteractiveMap();
    initPdfExporter();
    setupKabelMultiKoordinat();
});

// 1. ANIMASI HERO IMAGE (Floating & Shadow Effect via JavaScript Velocity Vector)
function initHeroAnimation() {
    const container = document.getElementById('hero-image-container');
    if (!container) return;

    let posX = 0;
    let posY = 0;
    let angle = 0;

    function floatAnimation() {
        angle += 0.02; // Nilai kecepatan getaran/ayunan melayang
        // Menghitung delta perpindahan translasi harmonis sederhana
        posX = Math.sin(angle) * 8;
        posY = Math.cos(angle * 1.5) * 12;

        container.style.transform = `translate(${posX}px, ${posY}px)`;
        // Efek dinamis pendaran bayangan (Neon Glow Pulse) sejalan dengan pergerakan
        const shadowIntensity = 0.2 + Math.abs(Math.sin(angle)) * 0.15;
        container.style.shadow = `0 10px 40px rgba(6, 182, 212, ${shadowIntensity})`;

        requestAnimationFrame(floatAnimation);
    }
    floatAnimation();
}

// 2. KONTROL ATURAN BIAYA DINAMIS WILAYAH (MULTIPLIER)
function initWilayahHandler() {
    const selector = document.getElementById('wilayah-select');
    const labelWilayah = document.getElementById('text-wilayah-aktif');

    selector.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'urban') appState.wilayahMultiplier = 1.25;
        else if (val === 'rural') appState.wilayahMultiplier = 0.9;
        else appState.wilayahMultiplier = 1.0;

        labelWilayah.textContent = selector.options[selector.selectedIndex].text.split('(')[0].trim();
        recalculateGlobalCosts();
    });
}

// 3. FITUR PENAMBAHAN KORDINAT MULTI-INPUT PADA KABEL
function setupKabelMultiKoordinat() {
    const btn = document.getElementById('btn-add-koordinat');
    const wrapper = document.getElementById('wrapper-kabel-koordinat');

    btn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'grid grid-cols-2 gap-1 node-koordinat mt-1';
        row.innerHTML = `
            <input type="number" step="any" placeholder="Lat" required class="input-field text-xs py-1.5 focus:border-purple-400">
            <input type="number" step="any" placeholder="Lng" required class="input-field text-xs py-1.5 focus:border-purple-400">
        `;
        wrapper.appendChild(row);
    });
}

// 4. PENANGANAN SUBMIT INPUT FORM & GENERASI TABEL DATA
function initFormHandlers() {
    // FORM 1: DATA TIANG
    document.getElementById('form-tiang').addEventListener('submit', (e) => {
        e.preventDefault();
        const baseCost = document.getElementById('tiang-fungsi').value === 'beli' ? 1200000 : 350000;
        const customCost = parseFloat(document.getElementById('tiang-biaya-custom').value) || 0;
        const subtotal = baseCost + customCost;

        const data = {
            id: appState.dataStore.tiang.length + 1,
            nama: document.getElementById('tiang-nama').value,
            lokasi: document.getElementById('tiang-lokasi').value,
            koordinat: `${document.getElementById('tiang-lat').value}, ${document.getElementById('tiang-lng').value}`,
            material: document.getElementById('tiang-material').value,
            status: document.getElementById('tiang-fungsi').value,
            cost: subtotal
        };
        appState.dataStore.tiang.push(data);
        renderTable('tiang');
        addMarkerToMap(document.getElementById('tiang-lat').value, document.getElementById('tiang-lng').value, data.nama, 'cyan');
        e.target.reset();
    });

    // FORM 2: DATA KABEL
    document.getElementById('form-kabel').addEventListener('submit', (e) => {
        e.preventDefault();
        const panjang = parseFloat(document.getElementById('kabel-panjang').value);
        const slack = parseFloat(document.getElementById('kabel-slack').value) / 100;
        const matCost = parseFloat(document.getElementById('kabel-biaya-mat').value);
        const jasaCost = parseFloat(document.getElementById('kabel-biaya-jasa').value);

        const totalPanjang = panjang * (1 + slack);
        const subtotal = totalPanjang * (matCost + jasaCost);

        const data = {
            id: appState.dataStore.kabel.length + 1,
            nama: document.getElementById('kabel-nama').value,
            fungsi: document.getElementById('kabel-fungsi').value,
            panjang: `${totalPanjang.toFixed(1)} m`,
            biayaSatuan: `Mat: ${matCost}, Jasa: ${jasaCost}`,
            cost: subtotal
        };
        appState.dataStore.kabel.push(data);
        renderTable('kabel');
        e.target.reset();
    });

    // FORM 3: DATA ODP
    document.getElementById('form-odp').addEventListener('submit', (e) => {
        e.preventDefault();
        const subtotal = parseFloat(document.getElementById('odp-biaya').value);

        const data = {
            id: appState.dataStore.odp.length + 1,
            nama: document.getElementById('odp-nama').value,
            koordinat: `${document.getElementById('odp-lat').value}, ${document.getElementById('odp-lng').value}`,
            splitter: document.getElementById('odp-splitter').value,
            cost: subtotal
        };
        appState.dataStore.odp.push(data);
        renderTable('odp');
        addMarkerToMap(document.getElementById('odp-lat').value, document.getElementById('odp-lng').value, data.nama, 'pink');
        e.target.reset();
    });

    // FORM 4: DATA ODC
    document.getElementById('form-odc').addEventListener('submit', (e) => {
        e.preventDefault();
        const subtotal = parseFloat(document.getElementById('odc-biaya').value);

        const data = {
            id: appState.dataStore.odc.length + 1,
            nama: document.getElementById('odc-nama').value,
            koordinat: `${document.getElementById('odc-lat').value}, ${document.getElementById('odc-lng').value}`,
            kapasitas: `${document.getElementById('odc-kapasitas').value} Core`,
            cost: subtotal
        };
        appState.dataStore.odc.push(data);
        renderTable('odc');
        addMarkerToMap(document.getElementById('odc-lat').value, document.getElementById('odc-lng').value, data.nama, 'emerald');
        e.target.reset();
    });

    // FORM 5: DATA RUMAH
    document.getElementById('form-rumah').addEventListener('submit', (e) => {
        e.preventDefault();
        const subtotal = parseFloat(document.getElementById('rumah-biaya').value);

        const data = {
            id: appState.dataStore.rumah.length + 1,
            nama: document.getElementById('rumah-nama').value,
            koordinat: `${document.getElementById('rumah-lat').value}, ${document.getElementById('rumah-lng').value}`,
            dropcable: `${document.getElementById('rumah-dropcable').value} Meter`,
            cost: subtotal
        };
        appState.dataStore.rumah.push(data);
        renderTable('rumah');
        addMarkerToMap(document.getElementById('rumah-lat').value, document.getElementById('rumah-lng').value, data.nama, 'amber');
        e.target.reset();
    });
}

// 5. RENDER DINAMIS BARIS TABEL BERDASARKAN DATA STORE
function renderTable(category) {
    const tableBody = document.querySelector(`#table-${category}-el tbody`);
    if (!tableBody) return;

    // Bersihkan placeholder jika ada data masuk pertama kali
    const placeholder = tableBody.querySelector('.placeholder-row');
    if (placeholder) placeholder.remove();

    // Ambil item terbaru yang baru saja di-push
    const currentList = appState.dataStore[category];
    const data = currentList[currentList.length - 1];

    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-900/60 transition-colors";

    let htmlContent = `<td class="p-3 font-mono font-bold">${data.id}</td>`;

    if (category === 'tiang') {
        htmlContent += `
            <td class="p-3 font-semibold">${data.nama}</td>
            <td class="p-3">${data.lokasi}</td>
            <td class="p-3 font-mono text-slate-400">${data.koordinat}</td>
            <td class="p-3 uppercase">${data.material}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${data.status === 'beli' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'}">${data.status.toUpperCase()}</span></td>
        `;
    } else if (category === 'kabel') {
        htmlContent += `
            <td class="p-3 font-semibold">${data.nama}</td>
            <td class="p-3 uppercase text-purple-400">${data.fungsi}</td>
            <td class="p-3 font-mono">${data.panjang}</td>
            <td class="p-3 text-slate-400 font-mono">${data.biayaSatuan}</td>
        `;
    } else if (category === 'odp') {
        htmlContent += `
            <td class="p-3 font-semibold">${data.nama}</td>
            <td class="p-3 font-mono text-slate-400">${data.koordinat}</td>
            <td class="p-3 text-pink-400 font-bold">${data.splitter}</td>
        `;
    } else if (category === 'odc') {
        htmlContent += `
            <td class="p-3 font-semibold">${data.nama}</td>
            <td class="p-3 font-mono text-slate-400">${data.koordinat}</td>
            <td class="p-3 text-emerald-400 font-bold">${data.kapasitas}</td>
        `;
    } else if (category === 'rumah') {
        htmlContent += `
            <td class="p-3 font-semibold">${data.nama}</td>
            <td class="p-3 font-mono text-slate-400">${data.koordinat}</td>
            <td class="p-3 text-amber-400 font-mono">${data.dropcable}</td>
        `;
    }

    // Tambahkan Cell Subtotal Cost Akhir Terpengaruh Multiplier Wilayah Terkini
    const adjustedCost = data.cost * appState.wilayahMultiplier;
    htmlContent += `<td class="p-3 text-right font-mono font-bold text-slate-100" data-base-cost="${data.cost}">Rp ${adjustedCost.toLocaleString('id-ID')}</td>`;

    tr.innerHTML = htmlContent;
    tableBody.appendChild(tr);

    recalculateGlobalCosts();
}

// 6. FUNGSI DELETE LIST BERDASARKAN KATEGORI KARTU SELEKTIF
window.clearList = function(category) {
    appState.dataStore[category] = [];
    const tableBody = document.querySelector(`#table-${category}-el tbody`);
    if (tableBody) {
        let colSpanCount = 5;
        if (category === 'tiang') colSpanCount = 7;
        if (category === 'kabel') colSpanCount = 6;
        
        tableBody.innerHTML = `<tr class="placeholder-row"><td colspan="${colSpanCount}" class="p-4 text-center text-slate-500 italic">Belum ada data diinput.</td></tr>`;
    }
    recalculateGlobalCosts();
};

// 7. KALKULASI AKUMULASI NILAI AKHIR BOQ GLOBAL (CAPEX TOTAL)
function recalculateGlobalCosts() {
    let totalAll = 0;

    Object.keys(appState.dataStore).forEach(category => {
        appState.dataStore[category].forEach(item => {
            totalAll += (item.cost * appState.wilayahMultiplier);
        });
    });

    // Update elemen DOM total teks rupiah utama pada tabel boq ter-render
    Object.keys(appState.dataStore).forEach(category => {
        const rows = document.querySelectorAll(`#table-${category}-el tbody tr:not(.placeholder-row)`);
        rows.forEach(row => {
            const lastTd = row.querySelector('td:last-child');
            const base = parseFloat(lastTd.getAttribute('data-base-cost'));
            if (base) {
                lastTd.textContent = `Rp ${(base * appState.wilayahMultiplier).toLocaleString('id-ID')}`;
            }
        });
    });

    document.getElementById('global-total-cost').textContent = `Rp ${totalAll.toLocaleString('id-ID')}`;
}

// 8. INFRASTRUKTUR FITUR SIMULASI INTEGRASI MAP INTERAKTIF (OpenStreetMap Satellite Layer)
let globalLeafletMap, drawnGeometries = [];
let tempKabelPoints = [];
let currentPolyline = null;

function initInteractiveMap() {
    // Pusat Default Koordinat Sorong Barat/Papua Barat (-0.8758, 131.2536)
    globalLeafletMap = L.map('map').setView([-0.8758, 131.2536], 14);

    // Memuat Esri World Imagery (Layer Citra Satelit Mirip Google Earth Pro Global secara Legal & Terbuka)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(globalLeafletMap);

    // Setup Handler Event Switcher Bar Toolbar Mode Playground
    const tools = ['tiang', 'kabel', 'odp', 'odc', 'rumah'];
    tools.forEach(t => {
        document.getElementById(`tool-${t}`).addEventListener('click', (e) => {
            tools.forEach(o => document.getElementById(`tool-${o}`).classList.remove('active-tool'));
            e.target.classList.add('active-tool');
            appState.activeMapTool = t;
            
            // Reset state titik jika keluar dari mode tarik kabel sekuensal tengah jalan
            if (t !== 'kabel') {
                tempKabelPoints = [];
                currentPolyline = null;
            }
        });
    });

    // Aksi Klik Utama di Atas Canvas Map untuk Penempatan Node Objek Real
    globalLeafletMap.on('click', (e) => {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);

        // Autofill otomatis kolom koordinat form aktif sesuai ketukan peta untuk efisiensi teknisi
        if (document.getElementById(`${appState.activeMapTool}-lat`)) {
            document.getElementById(`${appState.activeMapTool}-lat`).value = lat;
            document.getElementById(`${appState.activeMapTool}-lng`).value = lng;
        }

        // Jalankan logika render grafis peta
        if (appState.activeMapTool === 'kabel') {
            tempKabelPoints.push([e.latlng.lat, e.latlng.lng]);
            if (!currentPolyline) {
                currentPolyline = L.polyline(tempKabelPoints, {color: '#a855f7', weight: 4, opacity: 0.85}).addTo(globalLeafletMap);
                drawnGeometries.push(currentPolyline);
            } else {
                currentPolyline.setLatLngs(tempKabelPoints);
            }
            // Update hitungan panjang estimasi kasar jarak meter antar titik kordinat di form kabel
            if (tempKabelPoints.length > 1) {
                let totalDist = 0;
                for(let i=0; i<tempKabelPoints.length-1; i++) {
                    totalDist += globalLeafletMap.distance(tempKabelPoints[i], tempKabelPoints[i+1]);
                }
                document.getElementById('kabel-panjang').value = Math.round(totalDist);
            }
        } else {
            // Tempatkan node visual langsung di playground map
            let colorHex = '#06b6d4'; // Cyan
            if (appState.activeMapTool === 'odp') colorHex = '#ec4899'; // Pink
            if (appState.activeMapTool === 'odc') colorHex = '#10b981'; // Emerald
            if (appState.activeMapTool === 'rumah') colorHex = '#f59e0b'; // Amber

            addMarkerToMap(lat, lng, `Simulasi Node ${appState.activeMapTool.toUpperCase()}`, appState.activeMapTool);
        }
    });

    // Tombol Clear Atribut Map
    document.getElementById('clear-map-btn').addEventListener('click', () => {
        drawnGeometries.forEach(layer => globalLeafletMap.removeLayer(layer));
        drawnGeometries = [];
        tempKabelPoints = [];
        currentPolyline = null;
    });
}

function addMarkerToMap(lat, lng, title, typeStr) {
    if (!globalLeafletMap) return;
    
    let colorHex = '#06b6d4';
    if (typeStr === 'pink' || typeStr === 'odp') colorHex = '#ec4899';
    if (typeStr === 'emerald' || typeStr === 'odc') colorHex = '#10b981';
    if (typeStr === 'amber' || typeStr === 'rumah') colorHex = '#f59e0b';

    // Membuat penanda sirkular bercahaya (Neon Circle Marker)
    const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: colorHex,
        color: '#fff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.9,
        draggable: true
    }).addTo(globalLeafletMap);

    marker.bindPopup(`<strong class="font-mono text-slate-950">${title}</strong><br><span class="text-xs text-slate-600">${lat}, ${lng}</span>`).openPopup();
    drawnGeometries.push(marker);
}

// 9. FITUR LAPORAN EKSPOR OUTPUT KE FORMAT PDF (PRINT RAB AUTOMATION)
function initPdfExporter() {
    document.getElementById('btn-unduh-pdf').addEventListener('click', () => {
        const targetElement = document.getElementById('laporan-pdf-container');
        
        // Sembunyikan sementara tombol cetak di dalam area download agar file PDF rapi
        const btnCetak = document.getElementById('btn-unduh-pdf');
        const deleteButtons = document.querySelectorAll('.btn-delete-list');
        
        btnCetak.style.display = 'none';
        deleteButtons.forEach(b => b.style.display = 'none');

        const konfigurasiOpsional = {
            margin:       [10, 10, 10, 10],
            filename:     'RAB_Perencanaan_FTTH_2026.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, backgroundColor: '#020617', useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        // Jalankan ekspor ke PDF
        html2pdf().set(konfigurasiOpsional).from(targetElement).save().then(() => {
            // Tampilkan kembali tombol setelah berkas terunduh sempurna
            btnCetak.style.display = 'block';
            deleteButtons.forEach(b => b.style.display = 'block');
        }).catch(err => {
            console.error("Gagal melakukan unduh file PDF: ", err);
            btnCetak.style.display = 'block';
            deleteButtons.forEach(b => b.style.display = 'block');
        });
    });
}
let data = [];
const tbody = document.querySelector("#dataTable tbody");
const searchInput = document.getElementById("search");
const filterDenda = document.getElementById("filterDenda");
const filterTahanan = document.getElementById("filterTahanan");
const selectedList = document.getElementById("selectedList");
const totalDenda = document.getElementById("totalDenda");
const totalTahanan = document.getElementById("totalTahanan");
const historyList = document.getElementById("historyList");
const namaInput = document.getElementById("namaInput");

let selected = [];

function renderTable() {
  const sections = {
    ringan: document.getElementById("tableRingan"),
    sedang: document.getElementById("tableSedang"),
    berat: document.getElementById("tableBerat"),
  };

  for (const key in sections) sections[key].innerHTML = "";

  const q = searchInput.value.toLowerCase();

  const dendaFilter = filterDenda.value;
  const tahananFilter = filterTahanan.value;

  data.forEach((row, i) => {
    if ((dendaFilter && row.denda.toString() !== dendaFilter) || (tahananFilter && row.tahanan.toString() !== tahananFilter)) return;
    if (!row.pasal.toLowerCase().includes(q) && !row.deskripsi.toLowerCase().includes(q) && !row.denda.toString().includes(q) && !row.tahanan.toString().includes(q)) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" data-index="${i}" ${selected.includes(i) ? "checked" : ""}></td>
      <td>${row.pasal}</td>
      <td>${row.deskripsi}</td>
      <td>${row.denda}</td>
      <td>${row.tahanan} bulan</td>
    `;
    tr.addEventListener("click", () => toggleSelect(i));

    const kategori = row.kategori || "ringan";
    if (sections[kategori]) sections[kategori].appendChild(tr);
  });
}

function toggleSelect(index) {
  if (selected.includes(index)) {
    selected = selected.filter((i) => i !== index);
  } else {
    selected.push(index);
  }
  updateSummary();
  renderTable();
}

function updateSummary() {
  selectedList.innerHTML = "";
  let totalD = 0,
    totalT = 0;
  selected.forEach((i) => {
    const item = data[i];
    totalD += item.denda;
    totalT += item.tahanan;
    const li = document.createElement("li");
    li.textContent = `${item.pasal}`;
    selectedList.appendChild(li);
  });
  totalDenda.textContent = totalD;
  totalTahanan.textContent = `${totalT} bulan`;
}

function confirmSelection() {
  const nama = namaInput.value.trim();
  if (!nama || selected.length === 0) return alert("Masukkan nama dan pilih setidaknya satu pasal.");
  let pasalList = selected.map((i) => data[i].pasal).join(", ");
  let totalD = selected.reduce((sum, i) => sum + data[i].denda, 0);
  let totalT = selected.reduce((sum, i) => sum + data[i].tahanan, 0);
  const waktu = new Date().toLocaleTimeString();
  const record = `${waktu} - ${nama} - ${pasalList} - Denda: ${totalD}, Tahanan: ${totalT} bulan`;
  const li = document.createElement("li");
  li.textContent = record;
  historyList.appendChild(li);
  saveHistory();
  selected = [];
  updateSummary();
  renderTable();
}

function saveHistory() {
  localStorage.setItem("historyList", historyList.innerHTML);
}

function loadHistory() {
  const saved = localStorage.getItem("historyList");
  if (saved) historyList.innerHTML = saved;
}

function resetHistory() {
  historyList.innerHTML = "";
  localStorage.removeItem("historyList");
}

function populateFilters() {

  const dendaSet = new Set();
  const tahananSet = new Set();
  data.forEach((row) => {
    dendaSet.add(row.denda);
    tahananSet.add(row.tahanan);
  });

  filterDenda.innerHTML = '<option value="">Filter Denda</option>';
  filterTahanan.innerHTML = '<option value="">Filter Masa Tahanan</option>';
  dendaSet.forEach((val) => (filterDenda.innerHTML += `<option value="${val}">${val}</option>`));
  tahananSet.forEach((val) => (filterTahanan.innerHTML += `<option value="${val}">${val} bulan</option>`));
}

function loadCSV() {
  fetch("UUDMayday.csv")
    .then((res) => res.text())
    .then((text) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          data = results.data.map((row) => {
            const pasal = row["PASAL"];
            let kategori = (row["KATEGORI"] || "").trim().toLowerCase();

             if (pasal.startsWith("A")) {
              kategori = "Lantas";
            }
            if (pasal.startsWith("B")) {
              kategori = "ringan";
            }

            if (pasal.startsWith("C")) {
              kategori = "Sedang";
            }
            if (pasal.startsWith("D")) {
              kategori = "Berat";
            }

            return {
              pasal,
              deskripsi: row["DESKRIPSI"],
              denda: parseInt((row["DENDA"] || "0").replace(/[^\d]/g, "")),
              tahanan: parseInt((row["MASA TAHANAN"] || "0").replace(/[^\d]/g, "")),
              kategori,
            };
          });
          populateFilters();
          renderTable();
        },
      });
    });
}

searchInput.oninput = renderTable;

filterDenda.onchange = renderTable;
filterTahanan.onchange = renderTable;

loadHistory();
loadCSV();

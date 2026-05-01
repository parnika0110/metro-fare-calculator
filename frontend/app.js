const lineRegistry = { purple: purpleLine, green: greenLine, yellow: yellowLine, blue: blueLine, pink: pinkLine };
const stationLineMap = {};
for (const [color, arr] of Object.entries(lineRegistry)) {
  for (const s of arr) { if (!stationLineMap[s]) stationLineMap[s] = color; }
}

const graphService = new GraphService(graph);
const fareService = new FareService();
const routeService = new RouteService(graphService);
window._fareService = fareService;

let selectedSource = "", selectedDest = "";
let lastResult = null;
let tripHistory = [];
try { tripHistory = JSON.parse(localStorage.getItem("nmHistory") || "[]"); } catch(e) {}

let plannerSrc = "", plannerDst = "";
let passSrc = "", passDst = "";

function updateClock() {
  const now = new Date();
  const t = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const d = now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const tb = document.getElementById("timeBadge");
  if (tb) tb.textContent = `${d}  ${t}`;

  const nonPeak = fareService.isNonPeak(now);
  const pb = document.getElementById("peakBadge");
  if (pb) {
    pb.textContent = nonPeak ? "Non-Peak" : "Peak Hours";
    pb.className = "hdr-chip peak-chip " + (nonPeak ? "nonpeak" : "peak");
  }
}
updateClock();
setInterval(updateClock, 30000);

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const panel = document.getElementById("tab-" + btn.dataset.tab);
    if (panel) panel.classList.add("active");
    if (btn.dataset.tab === "fares") buildFareTable();
  });
});


function setupSearch(inputEl, listEl, setter) {
  if (!inputEl || !listEl) return;
  inputEl.addEventListener("focus", () => { renderDropdown(stations, listEl, inputEl, setter); listEl.style.display = "block"; });
  inputEl.addEventListener("input", () => {
    const v = inputEl.value.toLowerCase();
    renderDropdown(stations.filter(s => s.toLowerCase().includes(v)), listEl, inputEl, setter);
    listEl.style.display = "block";
  });
  document.addEventListener("click", e => {
    if (!inputEl.contains(e.target) && !listEl.contains(e.target)) listEl.style.display = "none";
  });
}

function renderDropdown(items, list, input, setter) {
  list.innerHTML = "";
  items.slice(0, 100).forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    li.onclick = () => { input.value = s; setter(s); list.style.display = "none"; };
    list.appendChild(li);
  });
}

setupSearch(document.getElementById("sourceInput"), document.getElementById("sourceList"), v => selectedSource = v);
setupSearch(document.getElementById("destInput"), document.getElementById("destList"), v => selectedDest = v);
setupSearch(document.getElementById("plannerSrc"), document.getElementById("plannerSrcList"), v => plannerSrc = v);
setupSearch(document.getElementById("plannerDst"), document.getElementById("plannerDstList"), v => plannerDst = v);
setupSearch(document.getElementById("passSrc"), document.getElementById("passSrcList"), v => passSrc = v);
setupSearch(document.getElementById("passDst"), document.getElementById("passDstList"), v => passDst = v);

document.getElementById("swapBtn").addEventListener("click", () => {
  const si = document.getElementById("sourceInput"), di = document.getElementById("destInput");
  [si.value, di.value] = [di.value, si.value];
  [selectedSource, selectedDest] = [selectedDest, selectedSource];
});

function adjustPassengers(d) {
  const el = document.getElementById("passengers");
  const disp = document.getElementById("passengerCount");
  let v = parseInt(el.value) + d;
  v = Math.max(1, Math.min(20, v));
  el.value = v; disp.textContent = v;
}

function adjustDays(d) {
  const el = document.getElementById("workDays");
  const disp = document.getElementById("workDaysCount");
  let v = parseInt(el.value) + d;
  v = Math.max(1, Math.min(31, v));
  el.value = v; disp.textContent = v;
}


function renderRoute(path, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  path.forEach((station, i) => {
    const tag = document.createElement("span");
    tag.className = `stag ${stationLineMap[station] || "purple"}`;
    if (i === 0 || i === path.length - 1) tag.classList.add("endpoint");
    tag.textContent = station;
    container.appendChild(tag);
    if (i < path.length - 1) {
      const arr = document.createElement("span");
      arr.className = "r-arrow"; arr.textContent = "›";
      container.appendChild(arr);
    }
  });
}

function calculate() {
  const src = selectedSource, dst = selectedDest;
  const card = document.querySelector('input[name="cardType"]:checked').value;
  const pax = parseInt(document.getElementById("passengers").value) || 1;

  if (!src || !dst) return alert("Please select both stations.");
  if (src === dst) return alert("Source and destination must be different.");

  const dt = new Date();
  const allRoutes = routeService.findAllRoutes(src, dst);
  if (!allRoutes.length) return alert("No route found between these stations.");

  const sorted = allRoutes.sort((a, b) => a.length - b.length);
  const best = sorted[0];
  const stops = best.length - 1;

  const base = fareService.getFare(stops);
  const discounted = Math.round(fareService.applyDiscount(base, dt, card));
  const total = discounted * pax;

  const nonPeak = fareService.isNonPeak(dt);
  const changes = routeService.getInterchanges(best, stationLineMap);
  const estMins = Math.round(stops * 1.8);

  lastResult = { src, dst, pax, total, discounted, stops, changes, estMins, best, card, dt };

  document.getElementById("emptyState").style.display = "none";
  const hero = document.getElementById("fareHero");
  hero.style.display = "flex";
  document.getElementById("fare").textContent = total;
  const disc = card !== "token" ? (nonPeak ? "10% non-peak discount" : "5% smart card discount") : "No discount applied";
  document.getElementById("fareNote").textContent = `${nonPeak ? "Non-Peak" : "Peak"} · ${card.toUpperCase()} · ${disc} · ₹${discounted}/person`;
  document.getElementById("statStops").textContent = stops;
  document.getElementById("statChanges").textContent = changes.length;
  document.getElementById("statTime").textContent = `~${estMins} min`;
  document.getElementById("statPer").textContent = `₹${discounted}`;

  const rc = document.getElementById("routeCard");
  rc.style.display = "block";
  renderRoute(best, "routeContainer");

  const ixRow = document.getElementById("interchangeRow");
  ixRow.innerHTML = "";
  changes.forEach(ch => {
    const badge = document.createElement("span");
    badge.className = "ix-badge";
    badge.textContent = ch;
    ixRow.appendChild(badge);
  });

  const altCard = document.getElementById("altCard");
  const altList = document.getElementById("altList");
  altList.innerHTML = "";
  const alts = sorted.slice(1, 4);
  if (alts.length) {
    altCard.style.display = "block";
    alts.forEach((route, idx) => {
      const altChanges = routeService.getInterchanges(route, stationLineMap);
      const div = document.createElement("div");
      div.className = "alt-route-item";
      div.innerHTML = `<div>
        <div class="ar-stops">${route.length - 1} stops · ~${Math.round((route.length - 1) * 1.8)} min</div>
        <div class="ar-changes">${altChanges.length} line change${altChanges.length !== 1 ? "s" : ""}</div>
      </div>
      <button style="padding:5px 12px;border:1px solid #E2E8F0;border-radius:20px;background:none;font-size:0.78rem;cursor:pointer;font-family:inherit;color:#475569" onclick="showAltRoute(${idx + 1})">View</button>`;
      altList.appendChild(div);
    });
  } else {
    altCard.style.display = "none";
  }
  window._sortedRoutes = sorted;

  tripHistory.push({ src, dst, pax, fare: total });
  if (tripHistory.length > 20) tripHistory = tripHistory.slice(-20);
  try { localStorage.setItem("nmHistory", JSON.stringify(tripHistory)); } catch(e) {}
  renderHistory();

  saveTrip(src, dst, pax, total, best);
}

function showAltRoute(idx) {
  if (!window._sortedRoutes) return;
  renderRoute(window._sortedRoutes[idx], "routeContainer");
}

function speakRoute() {
  if (!lastResult) return;
  const { best, src, dst, estMins } = lastResult;
  const text = `Your route from ${src} to ${dst}. ${best.length - 1} stops. Estimated travel time: ${estMins} minutes. Stations: ${best.join(", ")}.`;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.92;
    window.speechSynthesis.speak(utt);
  } else {
    alert("Voice not supported in this browser.");
  }
}

function stopVoice() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
function exportTicket() {
  if (!lastResult) return;
  const { src, dst, pax, total, stops, card, dt } = lastResult;
  document.getElementById("tkSrc").textContent = src;
  document.getElementById("tkDst").textContent = dst;
  document.getElementById("tkPax").textContent = pax;
  document.getElementById("tkFare").textContent = `₹${total}`;
  document.getElementById("tkStops").textContent = stops;
  document.getElementById("tkCard").textContent = card.charAt(0).toUpperCase() + card.slice(1);
  document.getElementById("tkDate").textContent = dt.toLocaleString("en-IN");
  document.getElementById("ticketModal").style.display = "flex";
}

function closeModal(e) {
  if (!e || e.target === document.getElementById("ticketModal"))
    document.getElementById("ticketModal").style.display = "none";
}

function renderHistory() {
  const wrap = document.getElementById("recentWrap");
  const list = document.getElementById("recentList");
  if (!tripHistory.length) { wrap.style.display = "none"; return; }
  wrap.style.display = "block";
  list.innerHTML = "";
  tripHistory.slice(-5).reverse().forEach(trip => {
    const el = document.createElement("div");
    el.className = "recent-item";
    el.innerHTML = `<span class="ri-route">${trip.src} → ${trip.dst}</span><span class="ri-meta">₹${trip.fare} · ${trip.pax} pax</span>`;
    el.onclick = () => {
      document.getElementById("sourceInput").value = trip.src; selectedSource = trip.src;
      document.getElementById("destInput").value = trip.dst; selectedDest = trip.dst;
      window.scrollTo(0, 0);
    };
    list.appendChild(el);
  });
}
renderHistory();

function planTrip() {
  const timeVal = document.getElementById("departureTime").value;
  if (!timeVal) return alert("Please enter departure time.");
  if (!plannerSrc || !plannerDst) return alert("Please select both stations.");
  if (plannerSrc === plannerDst) return alert("Select different stations.");

  const allRoutes = routeService.findAllRoutes(plannerSrc, plannerDst);
  if (!allRoutes.length) return alert("No route found.");

  const best = allRoutes.sort((a, b) => a.length - b.length)[0];
  const stops = best.length - 1;
  const estMins = Math.round(stops * 1.8);

  const [hh, mm] = timeVal.split(":").map(Number);
  const depart = new Date(); depart.setHours(hh, mm, 0, 0);
  const arrive = new Date(depart.getTime() + estMins * 60000);

  const fmt = d => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const nonPeak = fareService.isNonPeak(depart);

  document.getElementById("ptDepart").textContent = fmt(depart);
  document.getElementById("ptArrive").textContent = fmt(arrive);
  document.getElementById("ptDur").textContent = `${estMins} min`;
  document.getElementById("ptMode").textContent = nonPeak ? "Non-Peak" : "Peak";

  const tip = nonPeak
    ? `You're travelling in non-peak hours — Smart Card or NCMC gives you a 10% discount!`
    : `Peak hours are in effect. Consider travelling after 9 AM or before 5 PM for a 10% discount.`;
  document.getElementById("ptTip").textContent = tip;
  document.getElementById("plannerResult").style.display = "block";
}

function estimatePass() {
  if (!passSrc || !passDst) return alert("Please select your daily commute stations.");
  if (passSrc === passDst) return alert("Select different stations.");

  const allRoutes = routeService.findAllRoutes(passSrc, passDst);
  if (!allRoutes.length) return alert("No route found.");

  const stops = allRoutes.sort((a, b) => a.length - b.length)[0].length - 1;
  const days = parseInt(document.getElementById("workDays").value) || 22;

  const singleFare = fareService.getFare(stops);
  const monthlyToken = singleFare * 2 * days; // 2 trips/day

  const passMultiplier = 0.72; // roughly 28% cheaper than token
  const passPrice = Math.round(monthlyToken * passMultiplier / 10) * 10;
  const saved = monthlyToken - passPrice;

  document.getElementById("prToken").textContent = `₹${monthlyToken}`;
  document.getElementById("prPass").textContent = `₹${passPrice}`;
  document.getElementById("prSaved").textContent = `₹${saved}`;

  const pct = Math.round((saved / monthlyToken) * 100);
  document.getElementById("passTip").textContent =
    `A monthly pass saves you approximately ₹${saved} (${pct}%) over ${days} working days. That's ₹${Math.round(saved / 12)} per day back in your pocket!`;
  document.getElementById("passResult").style.display = "block";
}

function buildFareTable() {
  const table = document.getElementById("fareTable");
  if (table.innerHTML) return;
  const slabs = [
    [0,2,10],[3,4,20],[5,6,30],[7,8,40],[9,10,50],[11,14,60],[15,18,70],[19,26,80],[27,999,90]
  ];
  const dt = new Date();
  const nonPeak = fareService.isNonPeak(dt);
  table.innerHTML = `<thead><tr>
    <th>Distance (Stops)</th>
    <th>Token</th>
    <th>Smart Card (Peak)</th>
    <th>Smart Card (Non-Peak)</th>
    <th>NCMC (Peak)</th>
  </tr></thead>`;
  const tbody = document.createElement("tbody");
  slabs.forEach(([from, to, fare]) => {
    const label = to >= 999 ? `${from}+` : `${from}–${to}`;
    const peak = Math.round(fare * 0.95);
    const np = Math.round(fare * 0.9);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${label} stops</td><td>₹${fare}</td><td>₹${peak}</td><td>₹${np}</td><td>₹${peak}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

function saveTrip(src, dst, pax, fare, route) {
  fetch("http://localhost:3000/saveTrip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: src, destination: dst, passengers: pax, fare, route, timestamp: new Date() })
  }).catch(() => {});
}

window.calculate = calculate;
window.adjustPassengers = adjustPassengers;
window.adjustDays = adjustDays;
window.planTrip = planTrip;
window.estimatePass = estimatePass;
window.speakRoute = speakRoute;
window.exportTicket = exportTicket;
window.closeModal = closeModal;
window.showAltRoute = showAltRoute;
window.stopVoice = stopVoice;
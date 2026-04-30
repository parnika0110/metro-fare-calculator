console.log("APP JS LOADED");

// ==============================
// GLOBAL VARIABLES
// ==============================

let selectedSource = "";
let selectedDest = "";

const sourceInput = document.getElementById("sourceInput");
const destInput = document.getElementById("destInput");
const sourceList = document.getElementById("sourceList");
const destList = document.getElementById("destList");

// ==============================
// LINE COLORS (INTERCHANGES)
// ==============================

const lineMap = {
  "Majestic": "purple",
  "KR Pura": "blue",
  "Jayadeva Hospital": "pink",
  "Hebbal": "blue"
};

// ==============================
// SEARCH + DROPDOWN
// ==============================

function setupSearch(input, list, setValue) {

  input.addEventListener("focus", () => {
    renderList(stations, list, input, setValue);
    list.style.display = "block";
  });

  input.addEventListener("input", () => {
    let value = input.value.toLowerCase();

    let filtered = stations.filter(s =>
      s.toLowerCase().includes(value)
    );

    renderList(filtered, list, input, setValue);
    list.style.display = "block";
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      list.style.display = "none";
    }
  });
}

function renderList(items, list, input, setValue) {
  list.innerHTML = "";

  items.forEach(station => {
    let li = document.createElement("li");
    li.textContent = station;

    li.onclick = () => {
      input.value = station;
      setValue(station);
      list.style.display = "none";
    };

    list.appendChild(li);
  });
}

// ==============================
// INIT SERVICES
// ==============================

const graphService = new GraphService(graph);
const fareService = new FareService();
const routeService = new RouteService(graphService);

// ==============================
// INIT SEARCH
// ==============================

setupSearch(sourceInput, sourceList, val => selectedSource = val);
setupSearch(destInput, destList, val => selectedDest = val);

// ==============================
// ROUTE DISPLAY
// ==============================

function renderRoute(path) {
  const container = document.getElementById("routeContainer");
  container.innerHTML = "";

  path.forEach((station, index) => {
    let span = document.createElement("span");

    let line = lineMap[station] || "purple";
    span.className = `station ${line}`;

    if (
      station === "Majestic" ||
      station === "KR Pura" ||
      station === "Jayadeva Hospital" ||
      station === "Hebbal"
    ) {
      span.classList.add("interchange");
    }

    span.innerText = station;
    container.appendChild(span);

    if (index < path.length - 1) {
      let arrow = document.createElement("span");
      arrow.innerText = " → ";
      container.appendChild(arrow);
    }
  });
}

// ==============================
// MAIN FUNCTION
// ==============================

function calculate() {
  let src = selectedSource;
  let dest = selectedDest;
  let card = document.getElementById("cardType").value;
  let passengers = parseInt(document.getElementById("passengers").value) || 1;

  if (!src || !dest) return alert("Select stations");

  let dt = new Date();

  let allRoutes = routeService.findAllRoutes(src, dest);

  if (allRoutes.length === 0) {
    alert("No route found");
    return;
  }

  let bestRoute = allRoutes.sort((a, b) => a.length - b.length)[0];

  let count = bestRoute.length - 1;

  let base = fareService.getFare(count);
  let discounted = Math.round(fareService.applyDiscount(base, dt, card));
  let total = discounted * passengers;

  document.getElementById("fare").innerText = total;

  let mode = fareService.isNonPeak(dt) ? "Non-Peak" : "Peak";

  let changes = routeService.getInterchanges(bestRoute, lineMap);

  document.getElementById("info").innerText =
    `${mode} | ${passengers} passengers | Changes: ${changes.join(", ")}`;

  renderRoute(bestRoute);

  saveTrip(src, dest, passengers, total, bestRoute);
}

// ==============================
// DATABASE SAVE (SAFE)
// ==============================

function saveTrip(src, dest, passengers, fare, route) {
  fetch("http://localhost:3000/saveTrip", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      source: src,
      destination: dest,
      passengers,
      fare,
      route,
      timestamp: new Date()
    })
  })
  .then(() => console.log("Trip saved"))
  .catch(() => console.log("Running without DB"));
}

// ==============================
// MAKE FUNCTION GLOBAL
// ==============================

window.calculate = calculate;
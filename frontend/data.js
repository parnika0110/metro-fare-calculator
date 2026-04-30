function connectLine(stations) {
  let graph = {};
  for (let i = 0; i < stations.length; i++) {
    graph[stations[i]] = graph[stations[i]] || [];
    if (i > 0) graph[stations[i]].push(stations[i - 1]);
    if (i < stations.length - 1) graph[stations[i]].push(stations[i + 1]);
  }
  return graph;
}

function mergeGraphs(...graphs) {
  let merged = {};
  graphs.forEach(g => {
    for (let key in g) {
      merged[key] = merged[key] || [];
      merged[key].push(...g[key]);
    }
  });
  return merged;
}

const purpleLine = [
  "Whitefield","Channasandra","Kadugodi Tree Park","Pattandur Agrahara",
  "Sri Sathya Sai Hospital","Nallurhalli","Seetharam Palya","Hoodi",
  "Garudacharpalya","KR Pura","Benniganahalli","Baiyappanahalli",
  "Swami Vivekananda Road","Indiranagar","Halasuru","Trinity","MG Road",
  "Cubbon Park","Vidhana Soudha","Central College","Majestic",
  "City Railway Station","Magadi Road","Hosahalli","Vijayanagar",
  "Attiguppe","Deepanjali Nagar","Mysuru Road","Nayandahalli",
  "Rajarajeshwari Nagar","Jnanabharathi","Pattanagere","Kengeri",
  "Kengeri Bus Terminal"
];

const greenLine = [
  "Nagasandra","Dasarahalli","Jalahalli","Peenya Industry","Peenya",
  "Goraguntepalya","Yeshwantpur","Sandal Soap Factory","Mahalakshmi",
  "Rajajinagar","Kuvempu Road","Srirampura","Majestic","Chickpete",
  "KR Market","National College","Lalbagh","South End Circle","Jayanagar",
  "Rashtreeya Vidyalaya Road","Banashankari","Jaya Prakash Nagar",
  "Yelachenahalli","Konanakunte Cross","Doddakallasandra","Vajarahalli",
  "Thalaghattapura","Silk Institute"
];

const yellowLine = [
  "Rashtreeya Vidyalaya Road","Ragigudda","Jayadeva Hospital",
  "BTM Layout","Central Silk Board","HSR Layout","Agara Lake","Iblur",
  "Bellandur","Kadubeesanahalli","Devarabeesanahalli","Marathahalli",
  "Doddanekundi","DRDO Sports Complex","Mahadevapura","Garudacharpalya"
];

const blueLine = [
  "Central Silk Board","HSR Layout","Agara Lake","Iblur","Bellandur",
  "Kadubeesanahalli","Devarabeesanahalli","Marathahalli",
  "Doddanekundi","DRDO Sports Complex","Mahadevapura",
  "Garudacharpalya","KR Pura","Benniganahalli","Kasturinagar",
  "Horamavu","Kalyan Nagar","HBR Layout","Nagawara","Hebbal",
  "Kodigehalli","Jakkur Cross","Yelahanka","Bagalur Cross",
  "Bettahalasuru","Doddajala","Airport City",
  "Kempegowda International Airport"
];

const pinkLine = [
  "Kalena Agrahara","Hulimavu","IIM Bangalore","JP Nagar 4th Phase",
  "Jayadeva Hospital","Tavarekere","Dairy Circle","Lakkasandra",
  "Langford Town","Shivajinagar","Pottery Town","Tannery Road",
  "Venkateshpura","Kempapura","Veerannapalya","Hebbal"
];

let graph = mergeGraphs(
  connectLine(purpleLine),
  connectLine(greenLine),
  connectLine(yellowLine),
  connectLine(blueLine),
  connectLine(pinkLine)
);

for (let key in graph) {
  graph[key] = [...new Set(graph[key])];
}

// ✅ SORTED ALPHABETICALLY
const stations = Object.keys(graph).sort((a, b) =>
  a.toLowerCase().localeCompare(b.toLowerCase())
);
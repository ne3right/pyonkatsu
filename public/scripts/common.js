// Base map
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})
const googleMap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
  maxZoom: 18,
  subdomains:['mt0','mt1','mt2','mt3'],
  attribution: '&copy; Google'
});
const japanBaseMap = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
})

const grayIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet/dist/images/marker-shadow.png",
  iconSize: [20, 32.8],
  popupAnchor: [1, -10],
  shadowSize: [32.8, 32.8],
  className: "icon-gray",
});

function getParamFromUrl(paramName) {
  const params = new URL(document.location.href).searchParams;
  return params.get(paramName);
}

async function getPostingData(pref_id = null, city_id = null) {
  let response;

  if (!pref_id) {
    // 全国データ
    response = await fetch('/data/conquer/prefs.json');
  } else if (!city_id) {
    // 都道府県単位
    response = await fetch(`/data/conquer/pref${pref_id}.json`);
  } else {
    // 市区町村単位
    response = await fetch(`/data/conquer/pref${pref_id}_city${city_id}.json`);
  }
  return response.json();
}


function areatotalBox(totalValue, position){
  var control = L.control({position: position});
  control.onAdd = function () {

      var div = L.DomUtil.create('div', 'info progress')

      div.innerHTML += '<p>枚数 (全域)</p>'
      div.innerHTML += `<p><span class="progressValue">${totalValue}</span>枚</p>`

      return div;
  };

  return control
}

const milestones = [0, 100, 500, 1000, 5000]; //進捗枚数

const customCenterOverrides = {
  // 必要に応じて追加
  "東京都": { lat: 35.69384, lng: 139.70355 },
};
function legend() {
  var control = L.control({ position: 'topright' });
  control.onAdd = function () {

    var div = L.DomUtil.create('div', 'info legend')
    grades = milestones.slice().reverse();

    div.innerHTML += '<p>凡例</p>';

    var legendInnerContainerDiv = L.DomUtil.create('div', 'legend-inner-container', div);
    legendInnerContainerDiv.innerHTML += '<div class="legend-gradient"></div>';

    var labelsDiv = L.DomUtil.create('div', 'legend-labels', legendInnerContainerDiv);
    for (var i = 0; i < grades.length; i++) {
      labelsDiv.innerHTML += '<span>' + grades[i] + '枚</span>';
    }
    return div;
  };

  return control
}

function getProgressColor(value) {
  const blueStart = { r: 128, g: 224, b: 255 }; // 明るい青
  const blueEnd = { r: 0, g: 0, b: 255 };       // 濃い青

  let lower = milestones[0];
  let upper = milestones[milestones.length - 1];

  let index = 0;
  for (let i = 1; i < milestones.length; i++) {
    if (value < milestones[i]) {
      lower = milestones[i - 1];
      upper = milestones[i];
      index = i - 1;
      break;
    }
    index = i - 1;
  }

  const localPct = (value - lower) / (upper - lower);
  const globalPct = (index + localPct) / (milestones.length - 1); // 全体での位置

  const r = Math.round(blueStart.r + globalPct * (blueEnd.r - blueStart.r));
  const g = Math.round(blueStart.g + globalPct * (blueEnd.g - blueStart.g));
  const b = Math.round(blueStart.b + globalPct * (blueEnd.b - blueStart.b));

  return `rgb(${r}, ${g}, ${b})`;
}

function getGeoJsonStyle(value) {
  return {
    color: 'black',
    fillColor: getProgressColor(value),
    fillOpacity: 0.7,
    weight: 2,
  }
}

function setPolygonPopup(polygon, areaname, value) {
  let popupContent = `<b>${areaname}</b><br>`;
  popupContent += `トータル: ${value}枚<br>`;
  polygon.bindPopup(popupContent);

  // ▼ 一定値以上ならアイコンをマップ上に表示
  if (value >= 100) {
    const center = polygon.getBounds().getCenter();
    let image = './usagi_100.png';
    if (value >= 1000) {
      image = './usagi_1000.png';
    }
    const icon = L.icon({
      iconUrl: image,
      iconSize: [57, 80],
      iconAnchor: [28.5, 80],
    });

    L.marker([center.lat, center.lng], { icon: icon }).addTo(map);
  }
}

function loadMapByArea(data, area_name = null, pref_id = null, city_id = null) {
  for (let key in data) {
    const item = data[key];

    // パラメータによって処理を分岐
    let geoJsonUrl = '';
    let cpref = '';
    let ccity = '';
    let label = '';
    let subarea = '';
    let value = 0;
    let is_detail = false

    if (pref_id === null && city_id === null) {
      // 全国表示
      subarea = item.pref;
      cpref = key;
      label = item.pref;
      value = item.sum;
    } else if (pref_id !== null && city_id === null) {
      // 都道府県表示
      subarea = `${area_name}${item.city}`;
      cpref = pref_id;
      ccity = key;
      label = item.city;
      value = item.sum;
    } else if (pref_id !== null && city_id !== null) {
      // 市区町村詳細
      subarea = `${area_name}${item.address}`;
      label = item.address;
      value = item.sum;
      is_detail = true
    }
    geoJsonUrl = `https://uedayou.net/loa/${subarea}.geojson`;

    fetch(geoJsonUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch geojson for ${label}`);
        }
        return response.json();
      })
      .then((geoData) => {
        const polygon = L.geoJSON(geoData, { style: getGeoJsonStyle(value) });
        polygon.addTo(map);

        const centroid = polygon.getBounds().getCenter();
        if(!is_detail) {
          setMarkerWithTooltip(polygon, subarea, cpref, ccity, label, value);
        } else {
          setPolygonPopup(polygon, subarea, value);
        }
      })
      .catch((error) => {
        console.error('Error fetching geojson:', error);
      });
  }
}

function setMarkerWithTooltip(polygon, area_name, pref_id, city_id, label, value) { //全体マップの描画
  let center = polygon.getBounds().getCenter();
  if (customCenterOverrides[area_name]) {
    center = customCenterOverrides[area_name];
  }

  const marker = L.marker([center.lat, center.lng]).addTo(map);

  const tooltipContent = `
  <div style="text-align: center;">
    <strong>${label}</strong><br>
    <span style="font-size: 12px; color: gray;"> ${value} 枚</span>
  </div>
`;

  marker.bindTooltip(tooltipContent, {
    permanent: true,
    direction: 'bottom',
    offset: [-15, 40],
    className: "custom-tooltip"
  }).openTooltip();

  marker.on('click', function () {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('area_name', area_name);
    currentUrl.searchParams.set('pref_id', pref_id);
    currentUrl.searchParams.set('city_id', city_id);
    currentUrl.searchParams.set('lat', center.lat);
    currentUrl.searchParams.set('lng', center.lng);
    window.location.href = currentUrl.toString();
  });
}

var map = L.map("map", { preferCanvas: true, zoomControl: false }).setView([35.669400214188606, 139.48343915372877], 11);

const baseLayers = {
  'OpenStreetMap': osm,
  'Google Map': googleMap,
  '国土地理院地図': japanBaseMap,
};

japanBaseMap.addTo(map);
let layerControl = L.control.layers(baseLayers, null, { position: "topleft" }).addTo(map);

let areaList;
let progress;

const area_name = getParamFromUrl("area_name");
const pref_id = getParamFromUrl("pref_id");
const city_id = getParamFromUrl("city_id");
const lat = getParamFromUrl("lat");
const lng = getParamFromUrl("lng");

Promise.all([ getPostingData(pref_id, city_id)]).then(function (res) {
  postingdata = res[0];

  const total = Object.values(postingdata).reduce((acc, item) => acc + (item.sum || 0), 0);

  if (pref_id === null) {
    // 全国
    loadMapByArea(postingdata);
  } else if (pref_id !== null && (city_id === null || city_id === "")) {
    // 都道府県マップ
    map.setView([lat, lng], 11);
    loadMapByArea(postingdata,area_name, pref_id, null);
  } else if (pref_id !== null && city_id !== null) {
    // 市区町村マップ
    map.setView([lat, lng], 14);
    loadMapByArea(postingdata, area_name, pref_id, city_id);
  }

  //マップ合計と凡例を表示
  areatotalBox(total, 'topright').addTo(map)
  legend().addTo(map);

}).catch((error) => {
  console.error('Error in fetching data:', error);
});

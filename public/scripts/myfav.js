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

function setPolygonPopup(polygon, areaname, value, membername) {
  const center = polygon.getBounds().getCenter();

  // ▼ アイコンをマップ上に表示（一定以上で名前のファイルを表示）
  let image = `<img src="./usagi.png" style="width: 57px; height: 80px;" />`;
  if (value >= 1000) {
    image = `<img src="./${membername}.jpg" style="width: 50px; height: 50px;" />`;
  }
  const iconHtml = `
  <div style="text-align: center;">
    <div style="font-size: 12px; color: black;">${areaname}</div>
    ${image}
    <div style="font-size: 12px; color: black; background-color: rgba(255, 255, 255, 0.8); padding: 2px 4px; border-radius: 4px;">${membername}<br>${value}枚</div>
  </div>
`;
  const customIcon = L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [114, 160],
    iconAnchor: [28.5, 80],
  });
  const marker = L.marker(center, { icon: customIcon });

  if (overlays && overlays[membername]) {
    overlays[membername].addLayer(marker);
  } else {
    console.error(`Layer group for member "${membername}" not found.`);
  }  

}

function loadMapByArea(data, area_name = null, pref_id = null, city_id = null) {

  for (const [membername, areas] of Object.entries(data)) {
    for (const [key, item] of Object.entries(areas)) {
      let geoJsonUrl = '';
      let cpref = '';
      let ccity = '';
      let label = '';
      let subarea = '';
      let value = 0;
      let is_detail = false

      if (pref_id === null && city_id === null) {
        // 全国表示
        subarea = item.area;
        cpref = key;
        label = item.area;
        value = item.count;
      } else if (pref_id !== null && city_id === null) {
        // 都道府県表示
        subarea = `${area_name}${item.area}`;
        cpref = pref_id;
        ccity = key;
        label = item.area;
        value = item.count;
        is_detail = true
      } else if (pref_id !== null && city_id !== null) {
        // 市区町村詳細
        subarea = `${area_name}${item.area}`;
        label = item.area;
        value = item.count;
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
          polygon.addTo(overlays[membername]);

          const centroid = polygon.getBounds().getCenter();
          if (!is_detail) {
            setMarkerWithTooltip(polygon, subarea, cpref, ccity, label, value, membername);
          } else {
            setPolygonPopup(polygon, subarea, value, membername);
          }
        })
        .catch((error) => {
          console.error('Error fetching geojson:', error);
        });

    }
  }
}

function setMarkerWithTooltip(polygon, area_name, pref_id, city_id, label, value, membername) { //全体マップの描画
  let center = polygon.getBounds().getCenter();
  if (customCenterOverrides[area_name]) {
    center = customCenterOverrides[area_name];
  }
  
  const marker = L.marker([center.lat, center.lng]).addTo(map);
  if (overlays && overlays[membername]) {
    overlays[membername].addLayer(marker);
  } else {
    console.error(`Layer group for member "${membername}" not found.`);
  }  

  // ▼ アイコンをマップ上に表示（一定以上で名前のファイルを表示）
  let image = `<img src="./usagi.png" style="width: 57px; height: 80px;" />`;
  if (value >= 1000) {
    image = `<img src="./${membername}.jpg" style="width: 50px; height: 50px;" />`;
  }

  const tooltipContent = `
  <div style="text-align: center;">
    <div style="font-size: 12px; color: black;">${area_name}</div>
    ${image}
    <div style="font-size: 12px; color: black; background-color: rgba(255, 255, 255, 0.8); padding: 2px 4px; border-radius: 4px;">${membername}<br>${value}枚</div>
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
const overlays = {};
const overlayControls = {};

japanBaseMap.addTo(map);
let layerControl = L.control.layers(baseLayers, null, { position: "topleft" }).addTo(map);;
const memberLayers = {};
const memberOverlayLayers = {};

let areaList;
let progress;

const area_name = getParamFromUrl("area_name");
const pref_id = getParamFromUrl("pref_id");
const city_id = getParamFromUrl("city_id");
const lat = getParamFromUrl("lat");
const lng = getParamFromUrl("lng");

Promise.all([getMyFavPostingData(pref_id, city_id)]).then(function (res) {
  originaldata = res[0];
  postingdata = transformByMemberNameWithAreaKeys(originaldata);

  const total = Object.values(originaldata).reduce((acc, item) => acc + (item.sum || 0), 0);

  for (const [memberName, areas] of Object.entries(postingdata)) {
    overlays[memberName] = L.layerGroup().addTo(map); // レイヤーグループを作成して地図に追加
    overlayControls[memberName] = overlays[memberName]; // 表示用ラベルでレイヤーコントロールに登録
  }

  if (pref_id === null) {
    // 全国
    loadMapByArea(postingdata);
  } else if (pref_id !== null && (city_id === null || city_id === "")) {
    // 都道府県マップ
    map.setView([lat, lng], 11);
    loadMapByArea(postingdata, area_name, pref_id, null);
  } else if (pref_id !== null && city_id !== null) {
    // 市区町村マップ
    map.setView([lat, lng], 14);
    loadMapByArea(postingdata, area_name, pref_id, city_id);
  }
  //マップ合計と凡例を表示
  areatotalBox(total, 'topright').addTo(map)
  legend().addTo(map);
  L.control.layers(null, overlayControls, { collapsed: false }).addTo(map);

}).catch((error) => {
  console.error('Error in fetching data:', error);
});

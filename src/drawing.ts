import mapboxgl from "mapbox-gl";
import {
  RawOverpassNode,
} from "./interfaces";

import { FeatureCollection, Geometry, GeoJsonProperties, Feature, GeometryObject } from 'geojson';
import { isGreenRoad, isOrangeRoad, isRedRoad, isGreenPath } from "./osm-selectors";

export function drawMarkerAndCard(
  item: RawOverpassNode,
  map: mapboxgl.Map
): mapboxgl.Marker {
  const { lat, lon } = item;

  let markerOptions: mapboxgl.MarkerOptions = {};
  markerOptions.color = "gray";

  const defaultScale = 0.5;
  markerOptions.scale = defaultScale;

  if (item.tags && item.tags.capacity !== undefined) {
    const capacity = parseInt(item.tags.capacity);
    console.log({ capacity });
    let possibleScale = defaultScale + capacity / 30;
    if (possibleScale > 2) {
      possibleScale = 2;
    }
    markerOptions.scale = possibleScale;

    if (item.tags && item.tags.covered === "yes") {
      markerOptions.color = "green";
    }
    if (item.tags && item.tags.lit === "yes") {
      markerOptions.color = "yellow";
    }
    if (item.tags && item.tags.bicycle_parking === "shed") {
      markerOptions.color = "#00ec18";
    }
  }

  const marker = new mapboxgl.Marker(markerOptions)
    .setLngLat([lon, lat])
    .addTo(map);

  if (window.orientation !== undefined) {
    marker.getElement().addEventListener("click", (e) => {
      map.flyTo({
        center: [lon, lat],
      });
    });
  }
  return marker;
}

export function removeMarkers(markers: mapboxgl.Marker[]): void {
  markers.map((marker) => marker.remove());
}
export function removeStreetLayers(map: mapboxgl.Map): void {
  try {
    console.log("Removing sources...");
    map.removeLayer('greenRoadsId');
    map.removeLayer('redRoadsId');
    map.removeLayer('orangeRoadsId');
    map.removeLayer('greenPathsId');

    map.removeSource('greenRoads');
    map.removeSource('redRoads');
    map.removeSource('orangeRoads');
    map.removeSource('greenPaths');
  } catch (e) {
    console.log("not removing sources - at least one doesn't exist yet");
  }
}

export function addStreetLayers(map: mapboxgl.Map, geoJson: FeatureCollection<Geometry, GeoJsonProperties>) {
  /** Add below first vector layer */
  const layerToAddBefore = 'SharedUse';
  map.addSource('redRoads', {
    type: 'geojson',
    data: {
      features: geoJson.features.filter(isRedRoad),
      type: "FeatureCollection"
    }
  });
  map.addSource('orangeRoads', {
    type: 'geojson',
    data: {
      features: geoJson.features.filter(isOrangeRoad)
      ,
      type: "FeatureCollection"
    }
  });

  map.addSource('greenRoads', {
    type: 'geojson',
    data: {
      features: geoJson.features.filter(isGreenRoad)
      ,
      type: "FeatureCollection"
    }
  });

  map.addSource('greenPaths', {
    type: 'geojson',
    data: {
      features: geoJson.features.filter(isGreenPath)
      ,
      type: "FeatureCollection"
    }
  });


  // Add a new layer to visualize the polygon.
  map.addLayer({
    'id': 'redRoadsId',
    'type': 'line',
    'source': 'redRoads', // reference the data source
    'layout': {},
    'paint': {
      "line-color": "red",
      "line-width": 3,
      'line-opacity': 0.3
    },
  }, layerToAddBefore);

  map.addLayer({
    'id': 'orangeRoadsId',
    'type': 'line',
    'source': 'orangeRoads', // reference the data source
    'layout': {},
    'paint': {
      "line-color": "orange",
      "line-width": 3,
      'line-opacity': 0.5
    },
  }, layerToAddBefore);


  // Add a new layer to visualize the polygon.
  map.addLayer({
    'id': 'greenRoadsId',
    'type': 'line',
    'source': 'greenRoads', // reference the data source
    'layout': {},
    'paint': {
      "line-color": "#00FF00",
      "line-width": 7,
      'line-opacity': 0.8
    },
  }, layerToAddBefore);

  map.addLayer({
    'id': 'greenPathsId',
    'type': 'line',
    'source': 'greenPaths', // reference the data source
    'layout': {},
    'paint': {
      "line-color": "#00FF00",
      "line-width": 1,
      'line-opacity': 0.5
    },
  }, layerToAddBefore);
}

export function drawMarkersAndCards(
  map: mapboxgl.Map,
  items: RawOverpassNode[]
): mapboxgl.Marker[] {
  const markers = items
    .filter((item) => item.type === "node")
    .map((node: RawOverpassNode) => {
      return drawMarkerAndCard(node, map);
    });

  return markers;
}

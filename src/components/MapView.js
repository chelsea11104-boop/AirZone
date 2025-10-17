import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import stations from "../data/stations.json";

// 🎨 fungsi warna marker PM2.5
const getColorByPM25 = (pm25Value) => {
  const value = parseFloat(pm25Value);
  if (value <= 15.5) return "green";       // Baik
  if (value <= 55.4) return "yellow";      // Sedang
  if (value <= 150.4) return "orange";     // Tidak Sehat
  if (value <= 250.4) return "red";        // Sangat Tidak Sehat
  return "black";                          // Berbahaya
};

// 📍 buat marker warna
const createColoredIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

// 🔵 ikon lokasi pengguna
const userIcon = L.divIcon({
  className: "user-location",
  html: `
    <div style="
      background-color: #007bff;
      border: 2px solid white;
      border-radius: 50%;
      width: 15px;
      height: 15px;
      box-shadow: 0 0 8px rgba(0, 123, 255, 0.8);
    "></div>
  `,
  iconSize: [15, 15],
  iconAnchor: [7.5, 7.5],
});

// 🧭 Komponen Legend
const Legend = () => {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomleft" });
    legend.onAdd = () => {
      const div = L.DomUtil.create(
        "div",
        "info legend bg-white p-2 rounded shadow-md text-sm"
      );
      div.innerHTML = `
        <h4 style="margin-bottom:4px;">Kategori Udara (PM2.5)</h4>
        <div><i style="background:green;width:15px;height:15px;display:inline-block;margin-right:6px;"></i>Baik (0–15.5 µg/m³)</div>
        <div><i style="background:yellow;width:15px;height:15px;display:inline-block;margin-right:6px;"></i>Sedang (15.6–55.4 µg/m³)</div>
        <div><i style="background:orange;width:15px;height:15px;display:inline-block;margin-right:6px;"></i>Tidak Sehat (55.5–150.4 µg/m³)</div>
        <div><i style="background:red;width:15px;height:15px;display:inline-block;margin-right:6px;"></i>Sangat Tidak Sehat (150.5–250.4 µg/m³)</div>
        <div><i style="background:black;width:15px;height:15px;display:inline-block;margin-right:6px;"></i>Berbahaya (>250.5 µg/m³)</div>
      `;
      return div;
    };
    legend.addTo(map);
    return () => map.removeControl(legend);
  }, [map]);

  return null;
};

// 🎯 tombol "Temukan Saya"
function LocateButton({ userPosition }) {
  const map = useMap();

  useEffect(() => {
    const handleClick = () => {
      if (userPosition) {
        map.flyTo(userPosition, 13, { animate: true });
      } else {
        alert("Lokasi belum terdeteksi!");
      }
    };

    // buat tombol di kanan bawah
    const button = L.control({ position: "bottomright" });
    button.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      div.innerHTML = `
        <button id="locate-btn" style="
          background: white;
          border: none;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          font-size: 20px;
          transition: transform 0.2s;
        ">🎯</button>
      `;

      // aktifkan klik pada leaflet
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.on(div, "click", handleClick);

      return div;
    };

    button.addTo(map);

    return () => {
      map.removeControl(button);
    };
  }, [map, userPosition]);

  return null;
}

// 🗺️ Komponen utama
const MapView = () => {
  const [data, setData] = useState([]);
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    setData(stations);
  }, []);

  // melacak posisi user realtime
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Browser kamu tidak mendukung geolokasi.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPosition([latitude, longitude]);
      },
      (err) => console.error("Gagal mendapatkan lokasi:", err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="w-full h-[90vh] rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <MapContainer
        center={[-6.9, 107.6]}
        zoom={9}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* lokasi pengguna */}
        {userPosition && (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>📍 Lokasi Anda Saat Ini</Popup>
          </Marker>
        )}

        {/* marker kualitas udara */}
        {data.map((station) => {
          const color = getColorByPM25(station.pm25);
          return (
            <Marker
              key={station.id}
              position={[station.latitude, station.longitude]}
              icon={createColoredIcon(color)}
            >
              <Popup>
                <div className="text-sm font-medium">
                  <p><strong>Nama Lokasi:</strong> {station.nama_lokasi}</p>
                  <p><strong>Kabupaten:</strong> {station.kabupaten}</p>
                  <p><strong>PM2.5:</strong> {station.pm25}</p>
                  <p><strong>PM10:</strong> {station.pm10}</p>
                  <p><strong>O₃:</strong> {station.o3}</p>

                  <p><strong>Kategori:</strong> {
                    color === "green" ? "Baik" :
                    color === "yellow" ? "Sedang" :
                    color === "orange" ? "Tidak Sehat" :
                    color === "red" ? "Sangat Tidak Sehat" :
                    "Berbahaya"
                  }</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <Legend />
        <LocateButton userPosition={userPosition} />
      </MapContainer>
    </div>
  );
};

export default MapView;
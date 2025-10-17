import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import stations from "../data/stations.json";

// Fungsi warna marker PM2.5
const getColorByPM25 = (pm25Value) => {
  const value = parseFloat(pm25Value);
  if (value <= 15.5) return "green";        // Baik
  if (value <= 55.4) return "yellow";       // Sedang
  if (value <= 150.4) return "orange";      // Tidak Sehat
  if (value <= 250.4) return "red";         // Sangat Tidak Sehat
  return "black";                           // Berbahaya
};

// Buat marker warna
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

// Ikon lokasi pengguna (biru)
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

// Komponen Legend
const Legend = () => {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomleft" });

    legend.onAdd = () => {
      const div = L.DomUtil.create(
        "div",
        "info legend bg-white p-2 rounded shadow-md text-sm"
      );

      // Responsif untuk HP
      div.style.maxWidth = "160px";
      div.style.fontSize = "12px";
      div.style.overflow = "auto";

      div.innerHTML = `
        <h4 style="margin-bottom:4px;">Kategori Udara (PM2.5)</h4>
        <div><i style="background:green;width:12px;height:12px;display:inline-block;margin-right:6px;"></i>Baik (0–15.5 µg/m³)</div>
        <div><i style="background:yellow;width:12px;height:12px;display:inline-block;margin-right:6px;"></i>Sedang (15.6–55.4 µg/m³)</div>
        <div><i style="background:orange;width:12px;height:12px;display:inline-block;margin-right:6px;"></i>Tidak Sehat (55.5–150.4 µg/m³)</div>
        <div><i style="background:red;width:12px;height:12px;display:inline-block;margin-right:6px;"></i>Sangat Tidak Sehat (150.5–250.4 µg/m³)</div>
        <div><i style="background:black;width:12px;height:12px;display:inline-block;margin-right:6px;"></i>Berbahaya (>250.5 µg/m³)</div>
      `;
      return div;
    };

    legend.addTo(map);

    return () => map.removeControl(legend);
  }, [map]);

  return null;
};

// Komponen untuk melacak lokasi pengguna
function UserLocationMarker({ setUserPosition }) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Browser kamu tidak mendukung geolokasi.");
      return;
    }

    // posisi awal
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPosition([latitude, longitude]);
        map.setView([latitude, longitude], 12);
      },
      () => {
        alert("Lokasi belum terdeteksi!");
      }
    );

    // realtime update
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPosition([latitude, longitude]);
      },
      (err) => console.error("Gagal update lokasi:", err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, setUserPosition]);

  return null;
}

// Komponen utama
const MapView = () => {
  const [data, setData] = useState([]);
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    setData(stations);
  }, []);

  // Fungsi tombol Temukan Saya
  const handleFindMe = () => {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung geolokasi.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPosition([latitude, longitude]);
      },
      () => alert("Tidak dapat menemukan lokasi.")
    );
  };

  return (
    <div className="relative w-full h-[90vh] rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <MapContainer
        center={[-6.9, 107.6]}
        zoom={9}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* lokasi pengguna */}
        <UserLocationMarker setUserPosition={setUserPosition} />
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
                  <p>
                    <strong>Nama Lokasi:</strong> {station.nama_lokasi}
                  </p>
                  <p>
                    <strong>Kabupaten:</strong> {station.kabupaten}
                  </p>
                  <p>
                    <strong>PM2.5:</strong> {station.pm25} µg/m³
                  </p>
                  <p>
                    <strong>PM10:</strong> {station.pm10} µg/m³
                  </p>
                  <p>
                    <strong>O₃:</strong> {station.o3} µg/m³
                  </p>
                  <p>
                    <strong>Kategori:</strong>{" "}
                    {color === "green"
                      ? "Baik"
                      : color === "yellow"
                      ? "Sedang"
                      : color === "orange"
                      ? "Tidak Sehat"
                      : color === "red"
                      ? "Sangat Tidak Sehat"
                      : "Berbahaya"}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <Legend />
      </MapContainer>

      {/* Tombol Temukan Saya */}
      <button
        onClick={handleFindMe}
        className="absolute z-[1000] bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-full shadow-md hover:bg-blue-700 text-sm md:text-base"
      >
        🎯 Temukan Saya
      </button>
    </div>
  );
};

export default MapView;

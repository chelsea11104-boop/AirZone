import React from "react";
import MapView from "../components/MapView";

const HomePage = () => {
  return (
    <div className="bg-gradient-to-b from-blue-100 to-green-100 min-h-screen">
      <h1 className="text-center text-2x2 font-bold text-blue-700 py-4">
        AirZone - Peta Kualitas Udara Regional
      </h1>
      <MapView />
    </div>
  );
};

export default HomePage;

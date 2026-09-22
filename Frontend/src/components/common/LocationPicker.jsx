import { useEffect, useState } from "react";

function LocationPicker({ onSelect }) {
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [search, setSearch] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const map = L.map("map", {
      center: [20.5937, 78.9629],
      zoom: 6,
    //   zoomControl: false,
      maxZoom: 20
    });

    // Satellite Map (No API Key)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "© Esri – Satellite", maxZoom: 20 }
    ).addTo(map);

    let marker = null;
    let labelMarker = null;

    // CLICK EVENT
    map.on("click", async function (e) {
      const { lat, lng } = e.latlng;

      setLocation({ lat, lng });
      onSelect({ lat, lng });

      const fetchedAddress = await reverseGeocode(lat, lng);
      setAddress(fetchedAddress);

      // Remove old label
      if (labelMarker) map.removeLayer(labelMarker);

      // Add text label like Google Maps
      labelMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "location-label",
          html: fetchedAddress,
          iconSize: null
        }),
      }).addTo(map);

      // Normal marker
      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.marker(e.latlng).addTo(map);
      }
    });

    window._leafletMapInstance = map;
  }, []);

  // 🔄 Reverse Geocoding
  const reverseGeocode = async (lat, lng) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      return data.display_name || "Unknown Location";
    } catch (err) {
      return "Unknown Location";
    }
  };

  // SEARCH FUNCTION
  const handleSearch = async () => {
    if (!search.trim()) return;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      search
    )}&oq=${encodeURIComponent(
      search
    )}&format=json&limit=1`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      setLocation({ lat, lng });
      setAddress(data[0].display_name);

      const map = window._leafletMapInstance;
      map.setView([lat, lng], 18);
    } else {
      alert("Location not found!");
    }
  };

  return (
    <div className="flex w-full">
      {/* LEFT SIDE */}
      <div className="w-1/2 p-4">
        <h2 className="font-bold text-lg mb-3">Selected Location</h2>

        <input
          type="text"
          placeholder="Search place..."
          className="border px-3 py-2 rounded w-full mb-3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          type="button"
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        >
          Search
        </button>

        <div className="space-y-2">
          <div><strong>Address:</strong> {address || "---"}</div>
          <div><strong>Latitude:</strong> {location.lat || "---"}</div>
          <div><strong>Longitude:</strong> {location.lng || "---"}</div>
        </div>
      </div>

      {/* RIGHT SIDE MAP */}
      <div className="w-1/2">
        <div
          id="map"
          style={{
            height: "450px",
            width: "100%",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        ></div>
      </div>
    </div>
  );
}

export default LocationPicker;

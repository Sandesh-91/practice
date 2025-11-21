async function getCoordinates(cityName) {
  if (!cityName?.trim()) return null;

  const key = `geo_${cityName.toLowerCase().trim()}`;
  // const cached = localStorage.getItem(key);
  // if (cached) return JSON.parse(cached);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cityName
      )}&limit=1`
    );
    const data = await res.json();

    if (data?.[0]) {
      const coords = { lat: +data[0].lat, long: +data[0].lon };
      // localStorage.setItem(key, JSON.stringify(coords));
      return coords;
    }
  } catch (e) {
    console.error("Geocode failed:", e);
  }
  return null;
}

module.exports = getCoordinates;

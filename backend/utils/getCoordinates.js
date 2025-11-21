async function getCoordinates(cityName) {
  if (!cityName?.trim()) return null;

  const key = `geo_${cityName.toLowerCase().trim()}`;


  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cityName
      )}&limit=1`
    );
    const data = await res.json();

    if (data?.[0]) {
      const coords = { lat: +data[0].lat, long: +data[0].lon };

      return coords;
    }
  } catch (e) {
    console.error("Geocode failed:", e);
  }
  return null;
}

module.exports = getCoordinates;
const getCityNameByLatLng = async ({ lat, lng }) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&sensor=true&key=${
        import.meta.env.VITE_GOOGLE_API_KEY
      }`
    );
    const fullAdress = await response.json();

    return fullAdress?.results[0]?.address_components.find(
      (address) => address.types[0] == "administrative_area_level_2"
    );
  } catch (error) {
    console.log(error.message);
  }
};

const getTotalLogsByCity = async (logs, dateFilter) => {
  const coords = logs.map((log) => {
    const [_, month, year] = log.date_time.split(",")[0].split("/");
    return {
      ...log,
      splitDate: {
        month,
        year,
      },
    };
  });

  let promises = [];

  if (dateFilter) {
    promises = coords
      .filter((value) => {
        return value.splitDate.month == dateFilter.month;
      })
      .map(async (value) => {
        const cityName = await getCityNameByLatLng({
          lat: value.lat,
          lng: value.lng,
        });
        return cityName;
      });
  } else {
    promises = coords.map(async (value) => {
      const cityName = await getCityNameByLatLng({
        lat: value.lat,
        lng: value.lng,
      });
      return cityName;
    });
  }

  const response = await Promise.all(promises);

  const cityNames = response
    .filter((city) => city)
    .map((city) => city.long_name);

  const result = {};
  for (const cityName of cityNames) {
    if (result[cityName]) result[cityName]++;
    else result[cityName] = 1;
  }

  return {
    labels: Object.keys(result),
    data: Object.values(result),
  };
};

export { getTotalLogsByCity };

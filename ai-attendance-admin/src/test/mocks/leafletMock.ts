const L = {
  map: () => ({
    setView: () => {},
    remove: () => {},
    on: () => {},
    off: () => {},
  }),
  tileLayer: () => ({ addTo: () => {} }),
  circle: () => ({ addTo: () => {}, setLatLng: () => {}, setRadius: () => {} }),
  marker: () => ({ addTo: () => {}, bindPopup: () => {} }),
  latLng: (lat: number, lng: number) => ({ lat, lng }),
  Icon: { Default: { mergeOptions: () => {} } },
};

export default L;

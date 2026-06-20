export type LatLng = {
  latitude: number;
  longitude: number;
};

export type RoutePoint = LatLng & {
  timestamp?: number;
};

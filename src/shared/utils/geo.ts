import type { LatLng } from "@/shared/types/location";

const EARTH_RADIUS_METERS = 6_371_000;

export function haversineDistanceMeters(a: LatLng, b: LatLng) {
  const latitudeDelta = degToRad(b.latitude - a.latitude);
  const longitudeDelta = degToRad(b.longitude - a.longitude);
  const originLatitude = degToRad(a.latitude);
  const destinationLatitude = degToRad(b.latitude);

  const sinHalfLatitude = Math.sin(latitudeDelta / 2);
  const sinHalfLongitude = Math.sin(longitudeDelta / 2);

  const aValue =
    sinHalfLatitude * sinHalfLatitude +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      sinHalfLongitude *
      sinHalfLongitude;
  const cValue = 2 * Math.atan2(Math.sqrt(aValue), Math.sqrt(1 - aValue));

  return EARTH_RADIUS_METERS * cValue;
}

export function polylineWithinRadius(route: LatLng[], point: LatLng, radiusMeters: number) {
  return route.some((routePoint) => haversineDistanceMeters(routePoint, point) <= radiusMeters);
}

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

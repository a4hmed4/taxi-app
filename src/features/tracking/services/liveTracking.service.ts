import { onValue, ref, set } from "firebase/database";
import { realtimeDb } from "@/services/firebase/config";
import type { LatLng } from "@/shared/types/location";

type LiveLocation = LatLng & {
  heading?: number;
  speed?: number;
  updatedAt: number;
};

export function observeLiveLocation(tripId: string, onChange: (location: LiveLocation | null) => void) {
  const locationRef = ref(realtimeDb, `liveLocations/${tripId}`);

  return onValue(locationRef, (snapshot) => {
    onChange((snapshot.val() as LiveLocation | null) ?? null);
  });
}

export async function publishLiveLocation(tripId: string, location: LiveLocation) {
  return set(ref(realtimeDb, `liveLocations/${tripId}`), location);
}

import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "@/services/firebase/config";
import type { Trip } from "../types";

export function observePublishedTrips(onChange: (trips: Trip[]) => void) {
  const tripsQuery = query(collection(firestore, "trips"), where("status", "==", "published"));

  return onSnapshot(tripsQuery, (snapshot) => {
    const trips = snapshot.docs.map((tripDoc) => ({ id: tripDoc.id, ...(tripDoc.data() as Trip) }));
    onChange(trips);
  });
}

export function tripDocument(tripId: string) {
  return doc(firestore, "trips", tripId);
}

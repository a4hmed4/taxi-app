import { doc, getDoc, setDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firestore, storage } from "@/services/firebase/config";
import type { DriverProfile } from "../types";
import type { Trip } from "@/features/trips/types";
import { onSnapshot as observeSnapshot } from "firebase/firestore";

type SaveDriverProfileInput = {
  uid: string;
  phoneNumber: string;
  fullName: string;
  photoUri: string;
  car: DriverProfile["car"];
};

export async function saveDriverProfile(input: SaveDriverProfileInput) {
  const photoURL = await uploadDriverPhoto(input.uid, input.photoUri);
  const now = Date.now();

  const driverProfile: DriverProfile = {
    uid: input.uid,
    fullName: input.fullName,
    phoneNumber: input.phoneNumber,
    photoURL,
    role: "driver",
    car: input.car,
    onboardingCompleted: true,
    earningsTotal: 0,
    activeTripsCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(firestore, "drivers", input.uid), driverProfile, { merge: true });
  await setDoc(
    doc(firestore, "users", input.uid),
    {
      displayName: input.fullName,
      onboardingCompleted: true,
      updatedAt: now,
    },
    { merge: true }
  );

  return driverProfile;
}

export async function loadDriverProfile(uid: string) {
  const snapshot = await getDoc(doc(firestore, "drivers", uid));
  return (snapshot.data() as DriverProfile | undefined) ?? null;
}

export function observeDriverTrips(uid: string, onChange: (trips: Trip[]) => void) {
  const tripsQuery = query(collection(firestore, "trips"), where("driverId", "==", uid));

  return observeSnapshot(tripsQuery, (snapshot) => {
    const trips = snapshot.docs.map((tripDoc) => ({ id: tripDoc.id, ...(tripDoc.data() as Trip) }));
    onChange(trips);
  });
}

async function uploadDriverPhoto(uid: string, photoUri: string) {
  const response = await fetch(photoUri);
  const blob = await response.blob();
  const storageRef = ref(storage, `drivers/${uid}/profile.jpg`);

  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

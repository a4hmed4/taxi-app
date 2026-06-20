import { addDoc, collection } from "firebase/firestore";
import { firestore } from "@/services/firebase/config";
import type { LatLng, RoutePoint } from "@/shared/types/location";
import type { Trip } from "../types";
import type { DriverCarDetails } from "@/features/drivers/types";

type CreateTripInput = {
  driverId: string;
  driverName: string;
  origin: LatLng;
  destination: LatLng;
  route: RoutePoint[];
  departureTime: number;
  seatsAvailable: number;
  routeName: string;
  car?: DriverCarDetails;
  notes?: string;
};

export async function createTrip(input: CreateTripInput) {
  const timestamp = Date.now();

  const trip: Omit<Trip, "id"> = {
    driverId: input.driverId,
    driverName: input.driverName,
    role: "driver",
    origin: input.origin,
    destination: input.destination,
    route: input.route,
    departureTime: input.departureTime,
    seatsAvailable: input.seatsAvailable,
    seatsBooked: 0,
    status: "published",
    routeName: input.routeName,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (input.car) {
    trip.car = input.car;
  }

  if (input.notes) {
    trip.notes = input.notes;
  }

  await addDoc(collection(firestore, "trips"), trip);
}

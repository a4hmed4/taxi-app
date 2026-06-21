import * as admin from "firebase-admin";
import type { LocationAddress, MatchingTrip, Trip } from "../types";
import {
  filterMatchingTrips,
  rankAndFormatTrips,
  MatchingConfig,
} from "../utils/matching";

const firestore = admin.firestore();

/**
 * Find matching trips for a passenger
 */
export async function findMatchingTrips(
  pickup: LocationAddress,
  dropoff: LocationAddress,
  config: MatchingConfig = {},
  limit: number = 20
): Promise<MatchingTrip[]> {
  try {
    // Fetch all active trips (in production, use geospatial indexing)
    const tripsSnapshot = await firestore
      .collection("trips")
      .where("status", "==", "active")
      .where("availableSeats", ">", 0)
      .where("departureTime", ">", Date.now())
      .where("departureTime", "<", Date.now() + 120 * 60 * 1000) // 2 hours window
      .get();

    if (tripsSnapshot.empty) {
      return [];
    }

    // Parse trips
    const trips: Trip[] = tripsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Trip));

    // Filter matching trips
    const filtered = filterMatchingTrips(trips, pickup, dropoff, config);

    if (filtered.length === 0) {
      return [];
    }

    // Fetch driver data for additional info
    const driverIds = [...new Set(filtered.map((t) => t.driverId))];
    const driverDataMap = new Map();

    if (driverIds.length > 0) {
      // Fetch in batches (Firestore has a max of 10 in an IN query)
      const batches = [];
      for (let i = 0; i < driverIds.length; i += 10) {
        batches.push(driverIds.slice(i, i + 10));
      }

      for (const batch of batches) {
        const driversSnapshot = await firestore
          .collection("drivers")
          .where(admin.firestore.FieldPath.documentId(), "in", batch)
          .get();

        driversSnapshot.docs.forEach((doc) => {
          driverDataMap.set(doc.id, doc.data());
        });
      }
    }

    // Rank and format results
    const matches = rankAndFormatTrips(filtered, pickup, dropoff, driverDataMap, limit);

    return matches;
  } catch (error) {
    console.error("Error finding matching trips:", error);
    throw error;
  }
}

/**
 * Find matching trips with caching (future optimization)
 */
export async function findMatchingTripsWithCache(
  pickup: LocationAddress,
  dropoff: LocationAddress,
  config: MatchingConfig = {},
  limit: number = 20,
  cacheKey?: string
): Promise<{ matches: MatchingTrip[]; cached: boolean }> {
  // TODO: Implement Redis/Memcache for frequently requested routes
  // For now, just call the main function
  const matches = await findMatchingTrips(pickup, dropoff, config, limit);
  return { matches, cached: false };
}

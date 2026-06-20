import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as
  | {
      firebaseApiKey?: string;
      firebaseAuthDomain?: string;
      firebaseProjectId?: string;
      firebaseStorageBucket?: string;
      firebaseMessagingSenderId?: string;
      firebaseAppId?: string;
    }
  | undefined;

const firebaseConfig = {
  apiKey: extra?.firebaseApiKey ?? "",
  authDomain: extra?.firebaseAuthDomain ?? "",
  projectId: extra?.firebaseProjectId ?? "",
  storageBucket: extra?.firebaseStorageBucket ?? "",
  messagingSenderId: extra?.firebaseMessagingSenderId ?? "",
  appId: extra?.firebaseAppId ?? "",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);
export { firebaseConfig };

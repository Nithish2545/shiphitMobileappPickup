import { doc, getDoc } from "firebase/firestore";
import { db } from "../FirebaseConfig";
import { getCurrentVersion } from "../appVersion/appConfig";

export const checkForUpdate = async () => {
  try {
    const currentVersion = getCurrentVersion();

    const docRef = doc(db, "app_config", "c1fLBdWxEjO6ufPkfGVK");
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      console.log("is exists");
      return { updateAvailable: false };
    }
    const { latestVersion, apkUrl, forceUpdate } = snap.data();
    if (currentVersion < Number(latestVersion)) {
      console.log("new update");
      return {
        updateAvailable: true,
        latestVersion: latestVersion,
        apkUrl: apkUrl,
        forceUpdate: forceUpdate,
      };
    }
    return { updateAvailable: false };
  } catch (error) {
    console.log("Update check failed:", error);
    return { updateAvailable: false };
  }
};

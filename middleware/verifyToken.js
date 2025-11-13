import admin from "firebase-admin";

const initFirebase = (serviceAccountJSON) => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountJSON))
    });
  }
};

const verifyToken = (serviceAccountJSON) => {
  initFirebase(serviceAccountJSON);

  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing authorization header" });
      }
      const idToken = authHeader.split(" ")[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      // attach minimal user info
      req.user = { uid: decoded.uid, email: decoded.email, name: decoded.name || null };
      next();
    } catch (err) {
      console.error("Token verify error:", err);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

export default verifyToken;

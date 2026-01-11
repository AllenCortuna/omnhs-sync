import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/../firebase";

const SESSION_TOKEN_KEY = "omnhs_session_token";

/**
 * Generates a unique session token
 */
function generateSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Gets the current session token from localStorage
 */
export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

/**
 * Sets the session token in localStorage
 */
function setSessionToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

/**
 * Removes the session token from localStorage
 */
export function clearSessionToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

/**
 * Creates or updates a session token for a user in Firestore
 * This should be called after successful login
 */
export async function createUserSession(userId: string, userType: "admin" | "teacher" | "student"): Promise<string> {
  const sessionToken = generateSessionToken();
  const sessionData = {
    sessionToken,
    lastLogin: new Date().toISOString(),
    userType,
  };

  // Store in Firestore based on user type
  const userDocRef = doc(db, userType === "admin" ? "admin" : `${userType}s`, userId);
  await updateDoc(userDocRef, sessionData);

  // Store in localStorage
  setSessionToken(sessionToken);

  return sessionToken;
}

/**
 * Validates if the current session token matches the one in Firestore
 * Returns true if valid, false if invalid
 */
export async function validateSession(userId: string, userType: "admin" | "teacher" | "student"): Promise<boolean> {
  const currentToken = getSessionToken();
  
  if (!currentToken) {
    return false;
  }

  try {
    // Get session token from Firestore
    const userDocRef = doc(db, userType === "admin" ? "admin" : `${userType}s`, userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    const storedToken = userData.sessionToken;

    // Compare tokens
    if (storedToken && storedToken === currentToken) {
      return true;
    }

    // Token mismatch - session invalidated by another device
    return false;
  } catch (error) {
    console.error("Error validating session:", error);
    return false;
  }
}

/**
 * Invalidates the current session by logging out the user
 */
export async function invalidateSession(): Promise<void> {
  clearSessionToken();
  if (auth.currentUser) {
    await signOut(auth);
  }
}

/// <reference types="vite/client" />
// Mocked Firebase Configuration
const firebaseConfig = {
  projectId: "mock-project",
};

console.log("Mock Firebase Config initialized");

export const auth = {} as any;
export const db = {} as any;
export const serverTimestamp = () => new Date().toISOString();
export const getDocFromServer = async () => ({});
export const testConnection = async () => true;
export const signUpWithEmail = async () => ({});
export const loginWithEmail = async () => ({});
export const loginWithToken = async () => ({});
export const handleFirestoreError = (error: any, operation: string, path: string | null) => {
  console.error("Mocked Firestore Error:", error, operation, path);
};

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, collection, addDoc, updateDoc } from "firebase/firestore";
import { auth, db, loginWithEmail, signUpWithEmail, testConnection, getDocFromServer } from "../firebase";
import { UserProfile, PREDEFINED_USERS, INITIAL_TASKS, USERS_CREDENTIALS } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const DEFAULT_PASSWORD = "SeahubPassword123!";
  const LEGACY_PASSWORD = "Seahub123";

  useEffect(() => {
    if (!auth.app.options.apiKey) {
      setError("Configuração do Firebase incompleta: API Key ausente. Verifique as variáveis de ambiente.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          const email = firebaseUser.email?.toLowerCase();

          if (userDoc.exists()) {
            const existingProfile = userDoc.data() as UserProfile;
            
            // Check if role needs update based on PREDEFINED_USERS (e.g. if user was promoted)
            if (email && PREDEFINED_USERS[email] && existingProfile.role !== PREDEFINED_USERS[email].role) {
              console.log(`Updating role for predefined user ${email} to ${PREDEFINED_USERS[email].role}`);
              const updatedProfile = { ...existingProfile, role: PREDEFINED_USERS[email].role };
              await updateDoc(userDocRef, { role: PREDEFINED_USERS[email].role });
              setProfile(updatedProfile);
            } else {
              setProfile(existingProfile);
            }
          } else {
            if (!email) throw new Error("No email found in authenticated user");

            console.log("Identifying new user by email:", email);

            // Try to get data from invitedUsers first
            const invitedDoc = await getDoc(doc(db, "invitedUsers", email));
            let invitationData = invitedDoc.exists() ? invitedDoc.data() : null;

            // Fallback to PREDEFINED_USERS
            if (!invitationData && PREDEFINED_USERS[email]) {
              console.log("User found in PREDEFINED_USERS:", email);
              invitationData = {
                name: PREDEFINED_USERS[email].name,
                role: PREDEFINED_USERS[email].role
              };
            }

            if (invitationData) {
              console.log("Creating profile for user:", email, "with role:", invitationData.role);
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: invitationData.name || "Usuário",
                email: email,
                role: invitationData.role
              };
              await setDoc(userDocRef, newProfile);
              setProfile(newProfile);

              // Update status in invitedUsers if it exists
              const invitedDocRef = doc(db, "invitedUsers", email);
              const checkInvited = await getDoc(invitedDocRef);
              if (checkInvited.exists()) {
                await setDoc(invitedDocRef, { ...checkInvited.data(), status: "ativo", email: email }, { merge: true });
              }

              // Create initial tasks for collaborators
              if (invitationData.role === "COLABORADOR") {
                console.log("Creating initial tasks for collaborator:", email);
                for (const task of INITIAL_TASKS) {
                  await addDoc(collection(db, "tasks"), {
                    ...task,
                    userId: firebaseUser.uid,
                    createdBy: "SYSTEM",
                  });
                }
              }
      } else {
        setError(`O e-mail ${email} não está autorizado.`);
      }
          }
        } catch (err: any) {
          console.error("Error fetching user profile:", err);
          if (err.message?.includes("offline")) {
            setError("O banco de dados está offline. Tente novamente mais tarde.");
          } else {
            setError(`Erro ao carregar perfil do usuário: ${err.message || "Tente novamente mais tarde."}`);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, typedPassword?: string) => {
    setError(null);
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !typedPassword) {
      setError("Por favor, preencha e-mail e senha.");
      return;
    }

    try {
      setLoading(true);
      const result = await loginWithEmail(normalizedEmail, typedPassword);
      
      // Increment login count
      try {
        const userDocRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const currentCount = userDoc.data().loginCount || 0;
          await updateDoc(userDocRef, { loginCount: currentCount + 1 });
        }
      } catch (e) {
        console.error("Error incrementing login count:", e);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("E-mail ou senha incorretos.");
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
import { auth, db, signInWithGoogle } from "../firebase";
import { UserProfile, PREDEFINED_USERS, INITIAL_TASKS } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Check if user is in predefined list
            const email = firebaseUser.email?.toLowerCase();
            const predefined = email ? PREDEFINED_USERS[email] : null;

            if (predefined) {
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: predefined.name,
                email: firebaseUser.email || "",
                role: predefined.role
              };
              await setDoc(userDocRef, newProfile);
              setProfile(newProfile);

              // Create initial tasks for collaborators
              if (predefined.role === "COLABORADOR") {
                for (const task of INITIAL_TASKS) {
                  await addDoc(collection(db, "tasks"), {
                    ...task,
                    userId: firebaseUser.uid,
                    createdBy: "SYSTEM",
                  });
                }
              }
            } else {
              // User not in list - sign out
              await signOut(auth);
              setUser(null);
              setProfile(null);
              setError("Acesso não autorizado. Seu e-mail não está na lista de membros permitidos.");
            }
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setError("Erro ao carregar perfil do usuário.");
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Sign in error in AuthContext:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("O popup de login foi bloqueado pelo navegador. Por favor, permita popups para este site.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        // User closed the popup, no need to show error
      } else {
        setError("Erro ao realizar login com Google.");
      }
      throw err;
    }
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signIn, logout }}>
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

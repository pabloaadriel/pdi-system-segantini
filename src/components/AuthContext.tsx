import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
import { auth, db, signUpWithEmail, loginWithEmail } from "../firebase";
import { UserProfile, PREDEFINED_USERS, INITIAL_TASKS } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
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
            // This case might happen if sign up succeeded but profile creation failed
            // or if the user was deleted from Firestore but not Auth
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
            } else {
              await signOut(auth);
              setUser(null);
              setProfile(null);
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

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      await loginWithEmail(email, pass);
    } catch (err: any) {
      console.error("Login error in AuthContext:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("E-mail ou senha incorretos.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Muitas tentativas falhas. Tente novamente mais tarde.");
      } else {
        setError("Erro ao realizar login.");
      }
      throw err;
    }
  };

  const signUp = async (email: string, pass: string) => {
    setError(null);
    const normalizedEmail = email.toLowerCase();
    
    // Check if user is in predefined list (invited)
    const predefined = PREDEFINED_USERS[normalizedEmail];
    if (!predefined) {
      setError("Acesso não autorizado. Seu e-mail não está na lista de convidados.");
      throw new Error("Unauthorized email");
    }

    try {
      const result = await signUpWithEmail(email, pass);
      const firebaseUser = result.user;

      // Create profile immediately after signup
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        name: predefined.name,
        email: firebaseUser.email || "",
        role: predefined.role
      };
      
      await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
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
    } catch (err: any) {
      console.error("Signup error in AuthContext:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este e-mail já está em uso.");
      } else if (err.code === 'auth/weak-password') {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else if (err.code === 'auth/invalid-email') {
        setError("E-mail inválido.");
      } else {
        setError("Erro ao realizar cadastro.");
      }
      throw err;
    }
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, login, signUp, logout }}>
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

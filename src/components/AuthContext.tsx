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
  clearError: () => void;
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
            const email = firebaseUser.email?.toLowerCase();
            if (!email) throw new Error("No email found");

            // Try to get data from invitedUsers first
            const invitedDoc = await getDoc(doc(db, "invitedUsers", email));
            let invitationData = invitedDoc.exists() ? invitedDoc.data() : null;

            // Fallback to PREDEFINED_USERS
            if (!invitationData && PREDEFINED_USERS[email]) {
              invitationData = {
                name: PREDEFINED_USERS[email].name,
                role: PREDEFINED_USERS[email].role
              };
            }

            if (invitationData) {
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: invitationData.name || "Usuário",
                email: email,
                role: invitationData.role
              };
              await setDoc(userDocRef, newProfile);
              setProfile(newProfile);

              // Create initial tasks for collaborators
              if (invitationData.role === "COLABORADOR") {
                for (const task of INITIAL_TASKS) {
                  await addDoc(collection(db, "tasks"), {
                    ...task,
                    userId: firebaseUser.uid,
                    createdBy: "SYSTEM",
                  });
                }
              }
            } else {
              console.warn("User authenticated but not in invited list. Logging out.");
              await signOut(auth);
              setUser(null);
              setProfile(null);
            }
          }
        } catch (err: any) {
          console.error("Error fetching user profile:", err);
          setError(`Erro ao carregar perfil do usuário: ${err.message || "Tente novamente mais tarde."}`);
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
    const normalizedEmail = email.toLowerCase().trim();
    try {
      await loginWithEmail(normalizedEmail, pass);
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
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      // 1. Check if user is in invitedUsers collection
      const invitedDocRef = doc(db, "invitedUsers", normalizedEmail);
      const invitedDoc = await getDoc(invitedDocRef);
      
      let invitationData = invitedDoc.exists() ? invitedDoc.data() : null;

      // Fallback to PREDEFINED_USERS if not in Firestore yet (for legacy support)
      if (!invitationData && PREDEFINED_USERS[normalizedEmail]) {
        invitationData = {
          email: normalizedEmail,
          name: PREDEFINED_USERS[normalizedEmail].name,
          role: PREDEFINED_USERS[normalizedEmail].role,
          status: "pendente"
        };
      }

      if (!invitationData) {
        setError("Este e-mail não está na lista de convidados. Entre em contato com o administrador.");
        throw new Error("Email not invited");
      }

      // 2. Create the account in Firebase Auth
      const result = await signUpWithEmail(normalizedEmail, pass);
      const firebaseUser = result.user;

      // 3. Create profile in users collection
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        name: invitationData.name || "Usuário",
        email: firebaseUser.email || normalizedEmail,
        role: invitationData.role
      };
      
      try {
        await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
        setProfile(newProfile);

        // 4. Update status in invitedUsers
        await setDoc(invitedDocRef, { ...invitationData, status: "ativo", email: normalizedEmail }, { merge: true });

        // 5. Create initial tasks for collaborators
        if (invitationData.role === "COLABORADOR") {
          for (const task of INITIAL_TASKS) {
            await addDoc(collection(db, "tasks"), {
              ...task,
              userId: firebaseUser.uid,
              createdBy: "SYSTEM",
            });
          }
        }
      } catch (firestoreErr) {
        console.error("Firestore error during signup:", firestoreErr);
        // Even if firestore fails, the auth account is created. 
        // onAuthStateChanged will try to fix it on next load/refresh.
      }
    } catch (err: any) {
      console.error("Signup error in AuthContext:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este e-mail já possui uma conta ativa. Tente fazer login.");
      } else if (err.code === 'auth/weak-password') {
        setError("A senha deve ter no mínimo 6 caracteres.");
      } else if (err.code === 'auth/invalid-email') {
        setError("E-mail inválido.");
      } else if (err.message === "Email not invited") {
        // Error already set
      } else {
        setError(`Erro ao realizar cadastro: ${err.message || "Tente novamente mais tarde."}`);
      }
      throw err;
    }
  };

  const logout = async () => {
    await auth.signOut();
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, login, signUp, logout, clearError }}>
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

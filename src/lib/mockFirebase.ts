import { MOCK_TASKS, MOCK_USERS } from "../mockData";

export const collection = (db: any, path: string) => path;
export const query = (col: any, ...args: any[]) => ({ col, args });
export const where = (field: string, op: string, value: any) => ({ field, op, value });
export const doc = (db: any, path: string, id?: string) => ({ path, id });
export const serverTimestamp = () => new Date().toISOString();

export const onSnapshot = (q: any, callback: Function) => {
  setTimeout(() => {
    let data: any[] = [];
    if (q.col === "tasks" || q === "tasks") {
      data = MOCK_TASKS;
    } else if (q.col === "users" || q === "users") {
      data = MOCK_USERS;
    } else if (q.col === "invitedUsers" || q === "invitedUsers") {
      data = [];
    }
    
    callback({
      docs: data.map(d => ({
        id: d.id || d.uid || d.email,
        data: () => d
      }))
    });
  }, 100);
  return () => {};
};

export const getDoc = async (docRef: any) => {
  let data = null;
  if (docRef.path === "users") {
    data = MOCK_USERS.find(u => u.uid === docRef.id);
  }
  return {
    exists: () => !!data,
    id: docRef.id,
    data: () => data
  };
};

export const getDocs = async (q: any) => {
  let data: any[] = [];
  if (q.col === "tasks" || q === "tasks") {
    data = MOCK_TASKS;
  } else if (q.col === "users" || q === "users") {
    data = MOCK_USERS;
  }
  return {
    docs: data.map(d => ({
      id: d.id || d.uid,
      data: () => d
    }))
  };
};

export const setDoc = async () => {};
export const addDoc = async () => ({ id: "new-mock-id" });
export const updateDoc = async () => {};
export const deleteDoc = async () => {};

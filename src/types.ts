export type UserRole = "COLABORADOR" | "GESTOR";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  loginCount?: number;
}

export const USERS_CREDENTIALS = [
  { name: "Fúlvio", email: "fulvio@seahubcoworking.com.br", password: "FSEAHUB123", role: "COLABORADOR" as UserRole },
  { name: "Régis", email: "regis@seahubcoworking.com.br", password: "RSEAHUB123", role: "COLABORADOR" as UserRole },
  { name: "Diego", email: "diegosena@seahubcoworking.com.br", password: "DSEAHUB123", role: "COLABORADOR" as UserRole },
  { name: "Nathã", email: "natha@seahubcoworking.com.br", password: "NSEAHUB123", role: "COLABORADOR" as UserRole },
  { name: "Socorro", email: "socorro@seahubcoworking.com.br", password: "SSEAHUB123", role: "COLABORADOR" as UserRole },
  { name: "Maria Eduarda", email: "meduarda@seahubcoworking.com.br", password: "MESEAHUB123", role: "COLABORADOR" as UserRole },
  { name: "Guilherme", email: "guilherme@seahubcoworking.com.br", password: "GSEAHUB123", role: "GESTOR" as UserRole },
  { name: "Lara", email: "laramartins@segantiniconsultoria.com", password: "LSEAHUB123", role: "GESTOR" as UserRole },
];

export const PREDEFINED_USERS: Record<string, { name: string, role: UserRole }> = {
  "fulvio@seahubcoworking.com.br": { name: "Fúlvio", role: "COLABORADOR" },
  "regis@seahubcoworoking.com.br": { name: "Régis", role: "COLABORADOR" },
  "regis@seahubcoworking.com.br": { name: "Régis", role: "COLABORADOR" },
  "diegosena@seahubcoworking.com.br": { name: "Diego", role: "COLABORADOR" },
  "natha@seahubcoworking.com.br": { name: "Nathã", role: "COLABORADOR" },
  "socorro@seahubcoworking.com.br": { name: "Socorro", role: "COLABORADOR" },
  "meduarda@seahubcoworking.com.br": { name: "Maria Eduarda", role: "COLABORADOR" },
  "guilherme@seahubcoworking.com.br": { name: "Guilherme", role: "GESTOR" },
  "laramartins@segantiniconsultoria.com": { name: "Lara", role: "GESTOR" }
};

export type TaskStatus = "A fazer" | "Em andamento" | "Concluído";

export interface Task {
  id: string;
  userId: string;
  pillar: string;
  title: string;
  description?: string;
  deadline: string; // ISO 8601 (YYYY-MM-DD)
  status: TaskStatus;
  comment?: string;
  evidence?: string;
  createdBy: string;
  completedAt?: string; // ISO 8601 (YYYY-MM-DD)
}

export const PILARES = ["Educação", "Cultura e time", "Ritos de gestão e feedback"];

export const INITIAL_TASKS: Partial<Task>[] = [
  { pillar: "Educação", title: "Curso de Liderança", deadline: "2026-04-15", status: "A fazer" },
  { pillar: "Ritos de gestão e feedback", title: "1:1 Semanal", deadline: "2026-04-05", status: "A fazer" },
  { pillar: "Cultura e time", title: "Workshop de Feedback", deadline: "2026-05-10", status: "A fazer" },
];

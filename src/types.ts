export type UserRole = "COLABORADOR" | "GESTOR";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}

export const PREDEFINED_USERS: Record<string, { name: string, role: UserRole }> = {
  "fulvio@seahubcoworking.com.br": { name: "Fúlvio", role: "COLABORADOR" },
  "regis@seahubcoworoking.com.br": { name: "Régis", role: "COLABORADOR" },
  "diegosena@seahubcoworking.com.br": { name: "Diego", role: "COLABORADOR" },
  "natha@seahubcoworking.com.br": { name: "Nathã", role: "COLABORADOR" },
  "socorro@seahubcoworking.com.br": { name: "Socorro", role: "COLABORADOR" },
  "meduarda@seahubcoworking.com.br": { name: "Maria Eduarda", role: "COLABORADOR" },
  "laramartins@segantiniconsultoria.com": { name: "Lara Schmaltz", role: "GESTOR" },
  "guilherme@seahubcoworking.com.br": { name: "Guilherme", role: "GESTOR" },
  "pabloaadriel@gmail.com": { name: "Pablo Adriel", role: "GESTOR" }
};

export type TaskStatus = "Não Iniciado" | "Em Andamento" | "Concluído";

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
}

export const PILARES = ["Educação", "Ritos de Gestão", "Cultura e Time"];

export const INITIAL_TASKS: Partial<Task>[] = [
  { pillar: "Educação", title: "Curso de Liderança", deadline: "2026-04-15", status: "Não Iniciado" },
  { pillar: "Ritos de Gestão", title: "1:1 Semanal", deadline: "2026-04-05", status: "Não Iniciado" },
  { pillar: "Cultura e Time", title: "Workshop de Feedback", deadline: "2026-05-10", status: "Não Iniciado" },
];

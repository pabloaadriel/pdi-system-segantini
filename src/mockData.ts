import { Task, UserProfile, PILARES } from "./types";

export const MOCK_USER: any = {
  uid: "mock-user-123",
  email: "guilherme@seahubcoworking.com.br",
  displayName: "Guilherme (Mock)",
};

export const MOCK_PROFILE: UserProfile = {
  uid: "mock-user-123",
  name: "Guilherme (Gestor Mock)",
  email: "guilherme@seahubcoworking.com.br",
  role: "GESTOR",
  loginCount: 5,
};

export const MOCK_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Revisar relatórios financeiros",
    description: "Analisar os relatórios do último trimestre.",
    pillar: PILARES[0],
    deadline: "2026-04-10",
    status: "A fazer",
    userId: "mock-user-123",
    createdBy: "SYSTEM"
  },
  {
    id: "task-2",
    title: "Reunião de alinhamento",
    description: "Reunião com a equipe de marketing.",
    pillar: PILARES[1],
    deadline: "2026-04-12",
    status: "Em andamento",
    userId: "mock-user-123",
    createdBy: "SYSTEM"
  },
  {
    id: "task-3",
    title: "Atualizar documentação",
    description: "Atualizar os manuais internos.",
    pillar: PILARES[2],
    deadline: "2026-04-05",
    status: "Concluído",
    userId: "mock-user-123",
    createdBy: "SYSTEM"
  }
];

export const MOCK_USERS: UserProfile[] = [
  MOCK_PROFILE,
  {
    uid: "mock-user-456",
    name: "Fúlvio (Colaborador Mock)",
    email: "fulvio@seahubcoworking.com.br",
    role: "COLABORADOR",
    loginCount: 2,
  }
];

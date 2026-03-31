import React from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  readOnly?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, readOnly }) => {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'Concluído':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'Em Andamento':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Circle className="w-5 h-5 text-slate-300" />;
    }
  };

  const cycleStatus = () => {
    if (readOnly) return;
    const statuses: TaskStatus[] = ['Não Iniciado', 'Em Andamento', 'Concluído'];
    const currentIndex = statuses.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    onStatusChange(task.id, statuses[nextIndex]);
  };

  return (
    <div 
      className={clsx(
        "p-4 rounded-xl border transition-all duration-200",
        task.status === 'Concluído' ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-slate-100 shadow-sm",
        !readOnly && "cursor-pointer hover:border-primary/30"
      )}
      onClick={cycleStatus}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getStatusIcon()}</div>
        <div className="flex-1">
          <p className={clsx(
            "text-sm font-medium leading-tight",
            task.status === 'Concluído' ? "text-slate-500 line-through" : "text-slate-900"
          )}>
            {task.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {task.pillar}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
              {task.month}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;

import { Goal } from '@prisma/client';

export function calculateGoalStatus(goal: Goal, currentAmount: number): Partial<Goal> {
  const data = { currentAmount } as unknown as Partial<Goal>;
  const targetAmount = goal.targetAmount ? Number(goal.targetAmount) : null;

  if (targetAmount && currentAmount >= targetAmount) {
    data.status = 'COMPLETED';
  } else if (goal.status === 'NOT_STARTED' && currentAmount > 0) {
    data.status = 'IN_PROGRESS';
  }

  return data;
}

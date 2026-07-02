import { ClientAssignment } from '@prisma/client';
import { TUserSelect } from '../types';

export type FormattedAssignment = Omit<ClientAssignment, 'client'> & {
  user: TUserSelect;
};

export function formatAssignments(assignments: any[]): FormattedAssignment[] {
  return assignments.map(({ client, ...rest }) => ({
    ...rest,
    client: client.user as TUserSelect,
  }));
}

import { ClientAssignment } from '@prisma/client';
import { TUserSelect, TSelectClientAssignment} from '../types';

export type FormattedAssignment = Omit<ClientAssignment, 'client'> & {
  client: TUserSelect;
};

export function formatAssignments(assignments: TSelectClientAssignment[]): FormattedAssignment[] {
  return assignments.map(({ client, ...rest }) => ({
    ...rest,
    client: client.user as TUserSelect,
  }));
}

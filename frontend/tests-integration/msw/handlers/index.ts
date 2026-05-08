import { authHandlers } from './auth';
import { spacesHandlers } from './spaces';
import { inventoryHandlers } from './inventory';
import { usersHandlers } from './users';
import { reservationsHandlers } from './reservations';
import { auditHandlers } from './audit';
import { systemHandlers } from './system';
import { recomendacionesHandlers } from './recomendaciones';
import { miscHandlers } from './misc';

export const handlers = [
  ...authHandlers,
  ...spacesHandlers,
  ...inventoryHandlers,
  ...usersHandlers,
  ...reservationsHandlers,
  ...auditHandlers,
  ...systemHandlers,
  ...recomendacionesHandlers,
  ...miscHandlers,
];

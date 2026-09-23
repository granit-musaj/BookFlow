import { Role } from '@prisma/client';

/** Payload që vendoset në request.user pas verifikimit të JWT. */
export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  businessId: string;
};

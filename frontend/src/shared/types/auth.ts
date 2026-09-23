export type Role = 'OWNER' | 'STAFF' | 'CLIENT';

export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  businessId: string;
};

export type AuthResponse = {
  user: PublicUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

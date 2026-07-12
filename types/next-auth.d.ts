// types/next-auth.d.ts
import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: string;
    roleId?: string;
    driverProfileId?: string | null;
    status?: string;
  }

  interface Session {
    user: {
      id?: string;
      role?: string;
      roleId?: string;
      driverProfileId?: string | null;
      status?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    roleId?: string;
    driverProfileId?: string | null;
    status?: string;
  }
}

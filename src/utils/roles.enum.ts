import { SetMetadata } from "@nestjs/common";

export enum Role {
  SuperAdmin = "super_admin",
  SubAdmin = "sub_admin",
  Customer = "customer",
}

export const Roles = (...roles: string[]) => SetMetadata("roles", roles);

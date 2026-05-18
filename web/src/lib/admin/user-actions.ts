import { Role } from "@prisma/client";

export function userRowActionFlags(opts: {
  userId: string;
  userRole: Role;
  userEmail: string | null;
  hasPassword: boolean;
  orderCount: number;
  currentUserId: string;
  currentUserRole: Role;
}) {
  const { userId, userRole, userEmail, hasPassword, orderCount, currentUserId, currentUserRole } = opts;
  const isSelf = userId === currentUserId;

  let deleteBlockedReason: string | undefined;
  let canDelete = !isSelf && orderCount === 0;
  if (isSelf) {
    canDelete = false;
    deleteBlockedReason = "You cannot delete your own account.";
  } else if (orderCount > 0) {
    canDelete = false;
    deleteBlockedReason = "Users with orders cannot be deleted.";
  } else if (userRole !== Role.CUSTOMER && currentUserRole !== Role.ADMIN) {
    canDelete = false;
    deleteBlockedReason = "Only administrators can delete staff accounts.";
  }

  let resetBlockedReason: string | undefined;
  let canResetPassword = Boolean(userEmail && hasPassword);
  if (!userEmail) {
    canResetPassword = false;
    resetBlockedReason = "No email on file.";
  } else if (!hasPassword) {
    canResetPassword = false;
    resetBlockedReason = "No password login (OAuth only).";
  } else if (userRole !== Role.CUSTOMER && currentUserRole !== Role.ADMIN) {
    canResetPassword = false;
    resetBlockedReason = "Only administrators can reset staff passwords.";
  }

  return { canDelete, deleteBlockedReason, canResetPassword, resetBlockedReason };
}

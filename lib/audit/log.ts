import { Prisma } from "@prisma/client";

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  clubId?: string | null;
  metadata?: Prisma.InputJsonValue | Record<string, unknown> | null;
}

/**
 * Appends an audit entry within an existing database transaction.
 * Strict append-only: this module never exposes update or delete operations.
 */
export async function logAudit(
  tx: Prisma.TransactionClient,
  entry: AuditEntry
) {
  return tx.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      clubId: entry.clubId ?? null,
      metadata: (entry.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
  });
}

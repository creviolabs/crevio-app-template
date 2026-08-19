import { type AccessLevel, hasMinimumAccess } from "@/lib/access";

interface AccessGateProps {
	/** The visitor's access level for the resource (from server via getAccess()). */
	level: AccessLevel;
	/** Minimum level required to show children. Defaults to "customer". */
	minimum?: AccessLevel;
	/** Content shown when access is sufficient. */
	children: React.ReactNode;
	/** Optional fallback when access is insufficient. */
	fallback?: React.ReactNode;
}

/**
 * Conditionally render content by the visitor's access level. The level comes
 * from a route loader (always fresh from access.check), mirroring
 * whop-saas-starter's <PlanGate>.
 *
 * @example
 * <AccessGate level={access.accessLevel} minimum="customer" fallback={<Upgrade />}>
 *   <MembersOnlyContent />
 * </AccessGate>
 */
export function AccessGate({
	level,
	minimum = "customer",
	children,
	fallback = null,
}: AccessGateProps) {
	if (hasMinimumAccess(level, minimum)) return <>{children}</>;
	return <>{fallback}</>;
}

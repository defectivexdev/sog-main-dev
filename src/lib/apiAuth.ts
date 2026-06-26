import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveGangRole, isManager, GangRole } from "@/lib/roles";

type AuthenticatedContext = {
  req: NextRequest;
  session: any;
  role: GangRole;
  discordId: string;
};

type ApiHandler = (ctx: AuthenticatedContext, params?: any) => Promise<NextResponse> | NextResponse;

/**
 * Wrapper for API routes that require standard authentication.
 * Automatically checks for session and discordId.
 */
export function withAuth(handler: ApiHandler) {
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    try {
      const session = await auth();
      if (!session?.user?.discordId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const discordId = session.user.discordId;
      const role = resolveGangRole(discordId, session.user.discordRoles);
      return await handler({ req, session, role, discordId }, context?.params);
    } catch (error: any) {
      console.error("API Auth Error:", error);
      return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
  };
}

/**
 * Wrapper for API routes that require Manager authentication (Leader or Vice Leader).
 */
export function withManagerAuth(handler: ApiHandler) {
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    try {
      const session = await auth();
      if (!session?.user?.discordId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const discordId = session.user.discordId;
      const role = resolveGangRole(discordId, session.user.discordRoles);

      if (!isManager(role)) {
        return NextResponse.json({ success: false, error: "Forbidden: Managers only" }, { status: 403 });
      }

      return await handler({ req, session, role, discordId }, context?.params);
    } catch (error: any) {
      console.error("API Auth Error:", error);
      return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
  };
}

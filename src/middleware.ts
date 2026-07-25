import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/lib/i18n";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/kicheleboyz(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);

const handleI18nRouting = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl.pathname;

  if (isApiRoute(req)) {
    return NextResponse.next();
  }

  if (isAdminRoute(req)) {
    try {
      await auth.protect();
    } catch (e: any) {
      if (e?.location) {
        return NextResponse.redirect(e.location);
      }
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  return handleI18nRouting(req);
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
  ],
};

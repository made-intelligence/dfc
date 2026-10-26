import { NextResponse } from "next/server";
import { isWhatsAppEnabled } from "@/lib/whatsapp/service";

// Read at request time, so configuring an integration needs no rebuild.
export const dynamic = "force-dynamic";

// Which optional integrations are switched on, so pages can hide what isn't.
export async function GET() {
  return NextResponse.json({ whatsapp: isWhatsAppEnabled() });
}

import { handle } from "../route";
export const runtime = "nodejs";
export async function POST(request: Request) { return handle(request, false); }

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const SaveProfile = z.object({
  displayName: z.string().nullable().optional(),
  heightCm: z.number().nullable().optional(),
  bodyweightKg: z.number().nullable().optional(),
  birthYear: z.number().int().nullable().optional(),
  sex: z.enum(["male", "female"]).nullable().optional(),
  goal: z.enum(["strength", "hypertrophy", "recovery", "general"]).nullable().optional(),
  units: z.enum(["kg", "lb"]).optional(),
});

export async function GET() {
  const row = await prisma.profile.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(row ?? {});
}

export async function PUT(req: Request) {
  try {
    const body = SaveProfile.parse(await req.json());
    const saved = await prisma.profile.upsert({
      where: { id: "singleton" },
      update: body,
      create: { id: "singleton", ...body },
    });
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}

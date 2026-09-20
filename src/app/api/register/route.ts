import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2, "Името трябва да е поне 2 символа"),
  email: z.string().email("Невалиден имейл"),
  password: z.string().min(6, "Паролата трябва да е поне 6 символа"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Невалидни данни" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Вече има акаунт с този имейл." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Възникна грешка при регистрацията." },
      { status: 500 }
    );
  }
}

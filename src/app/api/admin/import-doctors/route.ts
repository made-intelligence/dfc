import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateDoctorSlug } from "@/lib/utils/slug";
import { requireAdminAuth, isAuthError } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must have header and at least one data row" },
        { status: 400 },
      );
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const requiredHeaders = [
      "name",
      "email",
      "phone",
      "specialty",
      // "license",
      "experience",
      "consultationfee",
    ];

    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required headers: ${missingHeaders.join(", ")}`,
        },
        { status: 400 },
      );
    }

    let imported = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());

      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      const doctorData: Record<string, string> = {};
      headers.forEach((header, index) => {
        doctorData[header] = values[index];
      });

      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: doctorData.email },
        });

        if (existingUser) {
          errors.push(`Row ${i + 1}: Email ${doctorData.email} already exists`);
          continue;
        }

        await prisma.$transaction(async (tx) => {
          const hashedPassword = await bcrypt.hash(doctorData.phone, 10);

          const user = await tx.user.create({
            data: {
              name: doctorData.name,
              email: doctorData.email,
              password: hashedPassword,
              phone: doctorData.phone,
              role: "DFC_MEMBER",
              isActive: true,
            },
          });

          // Find or create specialty
          let specialtyId: string | undefined;
          if (doctorData.specialty) {
            const existingSpecialty = await tx.specialty.findFirst({
              where: {
                name: { equals: doctorData.specialty, mode: "insensitive" },
              },
            });

            if (existingSpecialty) {
              specialtyId = existingSpecialty.id;
            } else {
              const newSpecialty = await tx.specialty.create({
                data: { name: doctorData.specialty },
              });
              specialtyId = newSpecialty.id;
            }
          }

          // Generate unique slug
          let slug = generateDoctorSlug(doctorData.name);
          let slugExists = await tx.doctorProfile.findUnique({
            where: { slug },
          });
          let counter = 1;

          while (slugExists) {
            slug = generateDoctorSlug(doctorData.name, counter);
            slugExists = await tx.doctorProfile.findUnique({ where: { slug } });
            counter++;
          }

          await tx.doctorProfile.create({
            data: {
              userId: user.id,
              slug,
              specialtyId,
              license: doctorData.license || null,
              experience: parseInt(doctorData.experience) || 0,
              bio: doctorData.bio || null,
              consultationFee: parseFloat(doctorData.consultationfee) || 0,
              currency: "NGN",
              isAvailable: true,
            },
          });
        });

        imported++;
      } catch (error) {
        errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return NextResponse.json({
      imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${imported} doctors${errors.length > 0 ? ` with ${errors.length} errors` : ""}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process CSV file",
      },
      { status: 500 },
    );
  }
}

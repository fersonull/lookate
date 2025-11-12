// Sign Up API Route
import { NextRequest, NextResponse } from "next/server";
import { SignUpUserUseCase } from "@/lib/application/use-cases/sign-up-user";
import { MongooseUserRepository } from "@/lib/infrastructure/database/repository/mongoose-user-repository";
import { signUpSchema } from "@/lib/application/schemas/auth-schemas";

const userRepository = new MongooseUserRepository();
const signUpUseCase = new SignUpUserUseCase(userRepository);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedFields = signUpSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedFields.error.format() },
        { status: 400 }
      );
    }

    // Execute sign up use case
    const result = await signUpUseCase.execute(validatedFields.data);
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Return success (without sensitive data)
    return NextResponse.json({
      success: true,
      user: result.user,
      // Don't return the token here - use NextAuth for session management
    });

  } catch (error) {
    console.error("Sign up error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
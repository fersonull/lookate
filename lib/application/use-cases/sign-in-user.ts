// Use Case - Sign In User
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "@/lib/domain/repositories/user-repository";
import { SignInData } from "../schemas/auth-schemas";

export class SignInUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(data: SignInData): Promise<{ token: string; user: { id: string; name: string; email: string; avatar?: string } } | null> {
    // Find user by email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user || !user.passwordHash) {
      return null; // Invalid credentials
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      return null; // Invalid credentials
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      jwtSecret,
      { 
        expiresIn: "7d" 
      }
    );

    // Return success response (without password hash)
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }
    };
  }
}
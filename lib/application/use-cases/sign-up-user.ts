// Use Case - Sign Up User
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "@/lib/domain/repositories/user-repository";
import { SignUpData } from "../schemas/auth-schemas";

export class SignUpUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(data: SignUpData): Promise<{ token: string; user: { id: string; name: string; email: string } } | { error: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      return { error: "A user with this email already exists" };
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    // Create user
    const user = await this.userRepository.create({
      email: data.email,
      name: data.name,
      passwordHash,
    });

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
      }
    };
  }
}
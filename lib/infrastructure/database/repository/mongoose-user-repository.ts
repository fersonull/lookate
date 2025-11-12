// MongoDB User Repository Implementation
import { UserRepository } from "@/lib/domain/repositories/user-repository";
import { User, UserProfile } from "@/lib/domain/entities/user";
import { UserModel, IUser } from "../models/user-model";
import { connectToDatabase } from "../mongodb";

export class MongooseUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    await connectToDatabase();
    const user = await UserModel.findById(id);
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    await connectToDatabase();
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    return user ? this.mapToEntity(user) : null;
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    await connectToDatabase();
    const user = new UserModel({
      ...userData,
      email: userData.email.toLowerCase(),
    });
    const savedUser = await user.save();
    return this.mapToEntity(savedUser);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await connectToDatabase();
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { ...userData, updatedAt: new Date() },
      { new: true }
    );
    return updatedUser ? this.mapToEntity(updatedUser) : null;
  }

  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async findActiveUsers(limit: number = 50): Promise<UserProfile[]> {
    await connectToDatabase();
    // Find users who have been active in the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const users = await UserModel.find({
      updatedAt: { $gte: thirtyMinutesAgo }
    })
    .select('_id name email avatar')
    .limit(limit)
    .sort({ updatedAt: -1 });

    return users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    }));
  }

  private mapToEntity(doc: IUser): User {
    return {
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      passwordHash: doc.passwordHash,
      avatar: doc.avatar,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
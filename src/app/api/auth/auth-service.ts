import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import User, { IUser } from '@/models/User';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  isVerified?: boolean;
}

export class AuthService {
  static async findUserByEmail(email: string): Promise<IUser | null> {
    await connectToDatabase();
    return User.findOne({ email: email.toLowerCase() });
  }

  static async findUserById(id: string): Promise<IUser | null> {
    await connectToDatabase();
    return User.findById(id);
  }

  static async createUser(userData: { username: string; email: string; password: string }): Promise<IUser> {
    await connectToDatabase();
    
    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const user = new User({
      username: userData.username,
      email: userData.email.toLowerCase(),
      password: hashedPassword
    });

    return await user.save();
  }

  static async validatePassword(user: IUser, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  static generateToken(userId: string, username: string): string {
    return jwt.sign(
      { userId, username },
      process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
      { expiresIn: '7d' }
    );
  }

  static async validateToken(token: string): Promise<{ userId: string; username: string } | null> {
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
      ) as { userId: string; username: string };
      
      return decoded;
    } catch (error) {
      return null;
    }
  }

  static userToPublic(user: IUser): PublicUser {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.username,
      createdAt: user.createdAt,
      isVerified: true
    };
  }
}

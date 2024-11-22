import { Schema, model, connect } from 'mongoose';
import { DatabaseAdapter, User } from '../types';

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

const UserModel = model<User>('User', userSchema);

export class MongooseAdapter implements DatabaseAdapter {
  constructor(mongoUri: string) {
    connect(mongoUri);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email }).select('+password');
    return user ? this.transformUser(user) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id);
    return user ? this.transformUser(user) : null;
  }

  async findUserByVerificationToken(token: string): Promise<User | null> {
    const user = await UserModel.findOne({ verificationToken: token });
    return user ? this.transformUser(user) : null;
  }

  async findUserByResetToken(token: string, expiryDate: Date): Promise<User | null> {
    const user = await UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: expiryDate },
    });
    return user ? this.transformUser(user) : null;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const user = await UserModel.create(userData);
    return this.transformUser(user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = await UserModel.findByIdAndUpdate(id, updates, { new: true });
    return user ? this.transformUser(user) : null;
  }

  private transformUser(user: any): User {
    const { _id, __v, ...rest } = user.toObject();
    return { id: _id.toString(), ...rest };
  }
}
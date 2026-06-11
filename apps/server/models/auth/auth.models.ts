import bcrypt from "bcrypt";
import { model, Schema, type Model } from "mongoose";

export interface IUser {
  fullName: string;
  email: string;
  password?: string;
  googleId?: string;
  githubId?: string;
  avatar?: string;
  avatarPublicId?: string;
  refreshToken?: string;
  status: "online" | "offline" | "away" | "busy";
  bio?: string;
  designation?: string;
  location?: string;
  lastSeen?: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    fullName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String, sparse: true, unique: true },
    githubId: { type: String, sparse: true, unique: true },
    avatar: { type: String },
    avatarPublicId: { type: String },
    refreshToken: { type: String },
    status: {
      type: String,
      enum: ["online", "offline", "away", "busy"],
      default: "offline",
    },
    bio: { type: String },
    designation: { type: String },
    location: { type: String },
    lastSeen: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = model<IUser, UserModel>("User", userSchema);

export default User;

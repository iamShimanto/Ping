import bcrypt from "bcrypt";
import { model, Schema, type Model } from "mongoose";

export interface IUser {
  fullName: string;
  email: string;
  password: string;
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
    password: { type: String, required: true },
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
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = model<IUser, UserModel>("User", userSchema);

export default User;

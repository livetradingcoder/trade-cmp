import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  fp_account_number: string;
  display_name?: string;
  account_verified: boolean;
  verified_at?: Date;
  referral_code_used?: string;
  is_new_user: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    fp_account_number: { type: String, required: true, unique: true },
    display_name: { type: String, default: "" },
    account_verified: { type: Boolean, default: false },
    verified_at: { type: Date },
    referral_code_used: { type: String },
    is_new_user: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", UserSchema);

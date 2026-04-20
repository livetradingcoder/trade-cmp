import mongoose, { Document, Schema } from "mongoose";

export interface IAccountSnapshot extends Document {
  trading_account_id: mongoose.Types.ObjectId;
  captured_at: Date;
  balance: number;
  equity: number;
  currency: string;
  source: "fixture" | "simulation" | "broker";
  createdAt: Date;
  updatedAt: Date;
}

const AccountSnapshotSchema: Schema = new Schema(
  {
    trading_account_id: {
      type: Schema.Types.ObjectId,
      ref: "TradingAccount",
      required: true,
    },
    captured_at: { type: Date, required: true },
    balance: { type: Number, required: true },
    equity: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    source: {
      type: String,
      enum: ["fixture", "simulation", "broker"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

AccountSnapshotSchema.index(
  { trading_account_id: 1, captured_at: 1 },
  { unique: true }
);

export default mongoose.model<IAccountSnapshot>(
  "AccountSnapshot",
  AccountSnapshotSchema
);

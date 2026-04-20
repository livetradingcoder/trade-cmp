import mongoose, { Document, Schema } from "mongoose";

export interface ITradingAccount extends Document {
  user_id: mongoose.Types.ObjectId;
  participant_id: mongoose.Types.ObjectId;
  tournament_id: mongoose.Types.ObjectId;
  broker_integration_id: mongoose.Types.ObjectId;
  broker_account_id?: string;
  broker_account_number: string;
  status: "active" | "pending" | "disabled";
  validated_at?: Date;
  last_synced_at?: Date;
  sync_state: "idle" | "ready" | "error";
  createdAt: Date;
  updatedAt: Date;
}

const TradingAccountSchema: Schema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participant_id: {
      type: Schema.Types.ObjectId,
      ref: "Participant",
      required: true,
    },
    tournament_id: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    broker_integration_id: {
      type: Schema.Types.ObjectId,
      ref: "BrokerIntegration",
      required: true,
    },
    broker_account_id: { type: String, default: "" },
    broker_account_number: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "pending", "disabled"],
      default: "active",
    },
    validated_at: { type: Date },
    last_synced_at: { type: Date },
    sync_state: {
      type: String,
      enum: ["idle", "ready", "error"],
      default: "idle",
    },
  },
  {
    timestamps: true,
  }
);

TradingAccountSchema.index(
  { tournament_id: 1, broker_account_number: 1 },
  { unique: true }
);
TradingAccountSchema.index({ participant_id: 1 });

export default mongoose.model<ITradingAccount>(
  "TradingAccount",
  TradingAccountSchema
);

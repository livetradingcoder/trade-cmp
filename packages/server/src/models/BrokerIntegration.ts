import mongoose, { Document, Schema } from "mongoose";

export interface IBrokerIntegration extends Document {
  type: "fixture" | "simulation" | "fpmarkets";
  name: string;
  enabled: boolean;
  supports_account_validation: boolean;
  supports_raw_trades: boolean;
  supports_snapshots: boolean;
  supports_broker_metrics: boolean;
  sync_frequency: "hourly";
  last_sync_at?: Date;
  last_sync_status?: "idle" | "success" | "partial" | "failed";
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const BrokerIntegrationSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ["fixture", "simulation", "fpmarkets"],
      required: true,
    },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    supports_account_validation: { type: Boolean, default: false },
    supports_raw_trades: { type: Boolean, default: false },
    supports_snapshots: { type: Boolean, default: false },
    supports_broker_metrics: { type: Boolean, default: false },
    sync_frequency: {
      type: String,
      enum: ["hourly"],
      default: "hourly",
    },
    last_sync_at: { type: Date },
    last_sync_status: {
      type: String,
      enum: ["idle", "success", "partial", "failed"],
      default: "idle",
    },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

BrokerIntegrationSchema.index({ type: 1, enabled: 1 });

export default mongoose.model<IBrokerIntegration>(
  "BrokerIntegration",
  BrokerIntegrationSchema
);

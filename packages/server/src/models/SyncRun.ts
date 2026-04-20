import mongoose, { Document, Schema } from "mongoose";

export interface ISyncRun extends Document {
  tournament_id: mongoose.Types.ObjectId;
  broker_integration_id: mongoose.Types.ObjectId;
  started_at: Date;
  finished_at?: Date;
  status: "running" | "success" | "partial" | "failed";
  accounts_processed: number;
  snapshots_written: number;
  trades_written: number;
  leaderboard_entries_written: number;
  error_summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SyncRunSchema: Schema = new Schema(
  {
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
    started_at: { type: Date, required: true },
    finished_at: { type: Date },
    status: {
      type: String,
      enum: ["running", "success", "partial", "failed"],
      default: "running",
    },
    accounts_processed: { type: Number, default: 0 },
    snapshots_written: { type: Number, default: 0 },
    trades_written: { type: Number, default: 0 },
    leaderboard_entries_written: { type: Number, default: 0 },
    error_summary: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

SyncRunSchema.index({ tournament_id: 1, started_at: -1 });

export default mongoose.model<ISyncRun>("SyncRun", SyncRunSchema);

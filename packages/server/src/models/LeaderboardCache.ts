import mongoose, { Schema, Document } from "mongoose";

export interface ILeaderboardRanking {
  rank: number;
  participant_id: mongoose.Types.ObjectId;
  trading_account_id: mongoose.Types.ObjectId;
  display_name: string;
  account_masked: string;
  roi: number;
  pnl: number;
  win_rate: number;
  trade_count: number;
  calculation_source: "computed_raw" | "broker_metrics";
  calculation_status: "ranked" | "insufficient_data";
  updated_at: Date;
}

export interface ILeaderboardCache extends Document {
  tournament_id: mongoose.Types.ObjectId;
  rankings: ILeaderboardRanking[];
  fetched_at: Date;
  expires_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RankingSchema: Schema = new Schema(
  {
    rank: { type: Number, required: true },
    participant_id: {
      type: Schema.Types.ObjectId,
      ref: "Participant",
      required: true,
    },
    trading_account_id: {
      type: Schema.Types.ObjectId,
      ref: "TradingAccount",
      required: true,
    },
    display_name: { type: String, required: true },
    account_masked: { type: String, required: true },
    roi: { type: Number, required: true },
    pnl: { type: Number, required: true },
    win_rate: { type: Number, required: true },
    trade_count: { type: Number, required: true },
    calculation_source: {
      type: String,
      enum: ["computed_raw", "broker_metrics"],
      required: true,
    },
    calculation_status: {
      type: String,
      enum: ["ranked", "insufficient_data"],
      required: true,
    },
    updated_at: { type: Date, required: true },
  },
  { _id: false }
);

const LeaderboardCacheSchema: Schema = new Schema(
  {
    tournament_id: { type: Schema.Types.ObjectId, ref: "Tournament", required: true, unique: true },
    rankings: [RankingSchema],
    fetched_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
LeaderboardCacheSchema.index({ tournament_id: 1 });
LeaderboardCacheSchema.index({ expires_at: 1 });

export default mongoose.model<ILeaderboardCache>("LeaderboardCache", LeaderboardCacheSchema);

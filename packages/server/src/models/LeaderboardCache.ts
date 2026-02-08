import mongoose, { Schema, Document } from "mongoose";

export interface IRanking {
  rank: number;
  display_name: string;
  account_masked: string;
  roi: number;
  user_id: mongoose.Types.ObjectId;
}

export interface ILeaderboardCache extends Document {
  tournament_id: mongoose.Types.ObjectId;
  rankings: IRanking[];
  fetched_at: Date;
  expires_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RankingSchema: Schema = new Schema(
  {
    rank: { type: Number, required: true },
    display_name: { type: String, required: true },
    account_masked: { type: String, required: true },
    roi: { type: Number, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
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

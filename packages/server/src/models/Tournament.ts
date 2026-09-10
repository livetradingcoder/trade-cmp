import mongoose, { Schema, Document } from "mongoose";

export interface ITournament extends Document {
  title: string;
  tier: string;
  prize: string;
  fee: string;
  participants: number;
  timeLabel: string;
  timeLeft: string;
  cover: string;
  image?: string;
  registrationLink: string;
  /**
   * Which broker this competition runs on. Optional: competitions created
   * before multi-broker support have none, and fall back to the fpmarkets
   * integration so they keep behaving exactly as before.
   */
  broker_integration_id?: mongoose.Types.ObjectId;
  /**
   * Referral code traders must sign up with at this competition's broker.
   * Empty means the site-wide affiliateCode, which is how every competition
   * worked before brokers could differ.
   */
  referral_code?: string;
  status: "draft" | "active" | "completed" | "archived";
  start_date?: Date;
  end_date?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    tier: { type: String, required: true, default: "Weekly" },
    prize: { type: String, default: "" },
    fee: { type: String, default: "" },
    participants: { type: Number, default: 0 },
    timeLabel: { type: String, default: "Seats Left" },
    timeLeft: { type: String, default: "" },
    cover: { type: String, required: true },
    image: { type: String, default: "" },
    registrationLink: { type: String, required: true },
    broker_integration_id: {
      type: Schema.Types.ObjectId,
      ref: "BrokerIntegration",
    },
    referral_code: { type: String },
    status: {
      type: String,
      enum: ["draft", "active", "completed", "archived"],
      default: "draft"
    },
    start_date: { type: Date },
    end_date: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITournament>("Tournament", TournamentSchema);

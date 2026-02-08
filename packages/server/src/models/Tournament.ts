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

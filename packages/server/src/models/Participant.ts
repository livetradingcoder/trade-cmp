import mongoose, { Schema, Document } from "mongoose";

export interface IParticipant extends Document {
  tournament_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "declined" | "disqualified";
  referral_code_verified: boolean;
  applied_at: Date;
  reviewed_at?: Date;
  reviewed_by?: mongoose.Types.ObjectId;
  decline_reason?: string;
  disqualified_at?: Date;
  disqualified_by?: mongoose.Types.ObjectId;
  disqualification_reason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema: Schema = new Schema(
  {
    tournament_id: { type: Schema.Types.ObjectId, ref: "Tournament", required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "declined", "disqualified"],
      default: "pending",
      required: true,
    },
    referral_code_verified: { type: Boolean, default: false },
    applied_at: { type: Date, default: Date.now },
    reviewed_at: { type: Date },
    reviewed_by: { type: Schema.Types.ObjectId, ref: "Admin" },
    decline_reason: { type: String },
    disqualified_at: { type: Date },
    disqualified_by: { type: Schema.Types.ObjectId, ref: "Admin" },
    disqualification_reason: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
ParticipantSchema.index({ tournament_id: 1, status: 1 });
ParticipantSchema.index({ user_id: 1 });

export default mongoose.model<IParticipant>("Participant", ParticipantSchema);

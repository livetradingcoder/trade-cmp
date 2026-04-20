import mongoose, { Document, Schema } from "mongoose";

export interface ITrade extends Document {
  trading_account_id: mongoose.Types.ObjectId;
  broker_trade_id: string;
  opened_at: Date;
  closed_at?: Date;
  symbol: string;
  side: "buy" | "sell";
  volume: number;
  open_price: number;
  close_price?: number;
  fees: number;
  swap: number;
  net_pnl: number;
  currency: string;
  source: "fixture" | "simulation" | "broker";
  createdAt: Date;
  updatedAt: Date;
}

const TradeSchema: Schema = new Schema(
  {
    trading_account_id: {
      type: Schema.Types.ObjectId,
      ref: "TradingAccount",
      required: true,
    },
    broker_trade_id: { type: String, required: true },
    opened_at: { type: Date, required: true },
    closed_at: { type: Date },
    symbol: { type: String, required: true },
    side: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },
    volume: { type: Number, required: true },
    open_price: { type: Number, required: true },
    close_price: { type: Number },
    fees: { type: Number, default: 0 },
    swap: { type: Number, default: 0 },
    net_pnl: { type: Number, required: true },
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

TradeSchema.index(
  { trading_account_id: 1, broker_trade_id: 1 },
  { unique: true }
);

export default mongoose.model<ITrade>("Trade", TradeSchema);

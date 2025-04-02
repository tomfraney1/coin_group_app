import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

const LocationSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true }
}, {
  timestamps: true
});

export const Location = mongoose.model<ILocation>('Location', LocationSchema); 
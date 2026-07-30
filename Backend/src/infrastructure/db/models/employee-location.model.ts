import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeLocation extends Document {
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: Date;
  isValid: boolean;
  provider: 'browser-geolocation' | 'gps' | 'network';
  speed?: number;
  heading?: number;
}

const employeeLocationSchema: Schema = new Schema({
  employeeId: {
    type: String,
    required: true,
    index: true,
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
  },
  accuracy: {
    type: Number,
    default: 0,
    description: 'Accuracy in meters',
  },
  address: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
  provider: {
    type: String,
    enum: ['browser-geolocation', 'gps', 'network'],
    default: 'browser-geolocation',
  },
  speed: {
    type: Number,
    default: null,
    description: 'Speed in km/h',
  },
  heading: {
    type: Number,
    default: null,
    description: 'Direction in degrees',
  },
}, { 
  timestamps: true,
  collection: 'employee_locations'
});

// Compound index for efficient queries by employee and time
employeeLocationSchema.index({ employeeId: 1, timestamp: -1 });

// Index for cleanup old records
employeeLocationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL

const EmployeeLocation = mongoose.model<IEmployeeLocation>(
  'EmployeeLocation',
  employeeLocationSchema
);

export default EmployeeLocation;

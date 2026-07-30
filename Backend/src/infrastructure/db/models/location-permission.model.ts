import mongoose, { Schema, Document } from 'mongoose';

export interface ILocationPermission extends Document {
  employeeId: string;
  trackingEnabled: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  lastTrackingUpdate?: Date;
  notes?: string;
}

const locationPermissionSchema: Schema = new Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  trackingEnabled: {
    type: Boolean,
    default: false,
  },
  grantedAt: {
    type: Date,
    default: null,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  lastTrackingUpdate: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: null,
  },
}, { 
  timestamps: true,
  collection: 'location_permissions'
});

const LocationPermission = mongoose.model<ILocationPermission>(
  'LocationPermission',
  locationPermissionSchema
);

export default LocationPermission;

import mongoose, { Schema, Document } from 'mongoose';
import { Types } from 'mongoose';
import { MechanicAssignment } from '../../domain/entities/Complaint';

export interface ComplaintDocument extends Document {
  complaintNumber: number; // Add this field
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  assignedMechanicId: Types.ObjectId;
  assignedMechanics: MechanicAssignment[]
  createdBy: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  productName?: string;
  productModel?: string;  
  address?: string;
  guaranteeDate?: Date;
  warrantyDate?: Date;
  status: {
    status: string;
    updatedAt: Date;
    updatedBy: string;
  };
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  workingStatus: string;
}

const CounterSchema = new Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 1000 } 
});

const CounterModel = mongoose.model('Counter', CounterSchema);

const ComplaintSchema: Schema = new Schema({
  complaintNumber: { type: Number, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  description: { type: String, required: true },
  assignedMechanics: [
    {
      mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
      status: { type: String, enum: ['pending', 'accept', 'reject'], required: true , default: 'pending'},
      reason: { type: String, default: null }
    }
  ],
  createdBy: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
  notes: { type: String },
  productName: { type: String },
  productModel: { type: String },
  address: { type: String },
  rejectionReason : {type : String},
  guaranteeDate: { type: Date },
  warrantyDate: { type: Date },
  status: {
    status: { type: String, required: true },
    updatedAt: { type: Date, required: true },
    updatedBy: { type: String, required: true }
  },
  isDeleted : {type : String, default:false},
  workingStatus : {
    type: String , enum :['pending','accept', 'rejected','processing','completed'], default : 'pending'
  },
  completionDetails: {
    description: { type: String },
    photos: [{ type: String }],
    completedAt: { type: Date },
    completedBy: { type: String },
    paymentStatus: { type: String },
    amount: { type: Number },
    paymentMethod: { type: String}
  }
}, { timestamps: true });

ComplaintSchema.pre<ComplaintDocument>('save', async function(next) {
  if (!this.isNew) {
    return next();
  }
  
  try {
    const counter = await CounterModel.findByIdAndUpdate(
      { _id: 'complaintNumber' },
      { $inc: { sequence_value: 1 } }, 
      { new: true, upsert: true }
    );
    
    if (counter.sequence_value === 1) {
      await CounterModel.findByIdAndUpdate(
        { _id: 'complaintNumber' },
        { $set: { sequence_value: 1000 } }
      );
      this.complaintNumber = 1000;
    } else {
      this.complaintNumber = counter.sequence_value;
    }
    next();
  } catch (err: unknown) {
  if (err instanceof Error) {
    next(err);
  } else {
    next(new Error(String(err)));
  }
 }
});

export const ComplaintModel = mongoose.model<ComplaintDocument>('Complaint', ComplaintSchema);
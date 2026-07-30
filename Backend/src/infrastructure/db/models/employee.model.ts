import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  emailId: { type: String, required: true },
  password: { type: String,  default: null},
  joinDate: { type: Date, required: true },
  contactNumber: { type: String, required: true },
  address: { type: String, required: false },
  currentSalary: { type: Number, required: true },
  age: { type: Number, required: true },
  position: { type: String, enum: ['coordinator', 'mechanic'], required: true },
  previousJob: { type: String },
  experience: { type: Number },
  isDeleted: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  workingStatus: { type: String, enum:['Available', 'Occupied'], default: "Available"},
  fieldOfMechanic: { type: [String], enum: ['Battery', 'Invertor', 'Inverter', 'Solar'], default: [] },
  lastAssignedAt: { type: Date, default: null }
},{
  timestamps: true,
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
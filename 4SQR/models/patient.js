// models/Patient.js
const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  name: { type: String, required: true },
  phoneNo: { type: String, required: true },
  address: { type: String, required: true },
  symptoms: { type: String, required: true },
  reason: { type: String, required: true },
  admitDate: { type: Date, required: true },
  doctor: { type: String, required: true },
  bedNumber: { type: String, required: true },
  accessPassword: { type: String, required: true }
  // Optionally, add a "reports" field if you implement file uploads.
});

module.exports = mongoose.model('Patient', PatientSchema);

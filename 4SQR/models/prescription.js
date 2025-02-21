const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PrescriptionSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true},
  doctor: { type: String, required: true },
  medication: { type: String},
  dosage: { type: String},
  instructions: { type: String, required: true }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);
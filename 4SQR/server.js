// server.js
require('dotenv').config();

const express    = require('express');
const mongoose   = require('mongoose');
const session    = require('express-session');
const bcrypt = require('bcryptjs');

const bodyParser = require('body-parser');
const QRCode     = require('qrcode');
const path       = require('path');

const Patient    = require('./models/patient');

const app = express();
const PORT = process.env.PORT || 3000;

// Use the environment variable MONGODB_URI if available, otherwise fallback to local connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/patientQR';

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session middleware (in production, use a robust session store)
app.use(session({
  secret: 'someSuperSecretKey', // change this secret for production
  resave: false,
  saveUninitialized: false
}));

// Middleware to protect routes (only allow access if authenticated for this patient record)
function checkAuth(req, res, next) {
  if (req.session && req.session.authenticated && req.session.patientId === req.params.id) {
    next();
  } else {
    res.redirect(`/patient/${req.params.id}`);
  }
}

// Routes

// Home – redirect to the add patient form
app.get('/', (req, res) => {
  res.redirect('/add');
});

// Render form to add a new patient record
app.get('/add', (req, res) => {
  res.render('addPatient', { error: null });
});

// Route to view all patients in the database
app.get('/patients/all', async (req, res) => {
  try {
    const patients = await Patient.find({});
    res.render('allPatients', { patients });
  } catch (err) {
    console.error(err);
    res.send('Error retrieving patients.');
  }
});

// Handle submission of patient data
app.post('/patients', async (req, res) => {
  try {
    // Extract fields from the form
    const { patientId, name, phoneNo, address, symptoms, reason, admitDate, doctor, bedNumber, accessPassword } = req.body;
    // Hash the access password securely using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(accessPassword, saltRounds);
    
    // Create and save a new patient record
    const newPatient = new Patient({
      patientId,
      name,
      phoneNo,
      address,
      symptoms,
      reason,
      admitDate,
      doctor,
      bedNumber,
      accessPassword: hashedPassword
      // (For reports, you could add file-upload handling here later)
    });
    await newPatient.save();
    
    // Determine the base URL for QR code generation:
    // Use the BASE_URL environment variable if set (e.g., your Render URL),
    // otherwise fallback to localhost (useful for local testing).
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const patientUrl = `${baseUrl}/patient/${newPatient._id}`;
    
    // Render the QR code page
    res.render('qr', { patientUrl });
  } catch (err) {
    console.error(err);
    res.render('addPatient', { error: 'Error creating patient record. Please try again.' });
  }
});

// (Optional) Endpoint to generate a QR code image – here we use a third-party API in the view.
app.get('/qrcode/:id', async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const patientUrl = `${baseUrl}/patient/${req.params.id}`;
    // Generate QR code as Data URL (if you wish to generate on the server)
    const qrCodeData = await QRCode.toDataURL(patientUrl);
    res.send(`<img src="${qrCodeData}" alt="QR Code">`);
  } catch (err) {
    console.error(err);
    res.send('Error generating QR code.');
  }
});

// Patient record access page – prompts for a password
app.get('/patient/:id', (req, res) => {
  res.render('passwordPrompt', { patientId: req.params.id, error: null });
});

// Process the password submission and log the user in
app.post('/patient/:id/login', async (req, res) => {
  try {
    const { password } = req.body;
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.send('Patient record not found.');
    }
    // Verify the password using bcrypt
    const match = await bcrypt.compare(password, patient.accessPassword);
    if (match) {
      // Mark session as authenticated for this patient record
      req.session.authenticated = true;
      req.session.patientId = req.params.id;
      res.redirect(`/patient/${req.params.id}/dashboard`);
    } else {
      res.render('passwordPrompt', { patientId: req.params.id, error: 'Incorrect password. Try again.' });
    }
  } catch (err) {
    console.error(err);
    res.send('Error during login.');
  }
});

// Dashboard: Shows two options – view or edit details
app.get('/patient/:id/dashboard', checkAuth, (req, res) => {
  res.render('dashboard', { patientId: req.params.id });
});

// View patient details (read-only)
app.get('/patient/:id/view', checkAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.send('Patient not found.');
    }
    res.render('viewPatient', { patient });
  } catch (err) {
    console.error(err);
    res.send('Error retrieving patient details.');
  }
});

// Render the edit form pre-populated with the patient’s details
app.get('/patient/:id/edit', checkAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.send('Patient not found.');
    }
    res.render('editPatient', { patient, error: null });
  } catch (err) {
    console.error(err);
    res.send('Error retrieving patient details for editing.');
  }
});

// Process the submitted edits
app.post('/patient/:id/edit', checkAuth, async (req, res) => {
  try {
    const { patientId, name, phoneNo, address, symptoms, reason, admitDate, doctor, bedNumber } = req.body;
    await Patient.findByIdAndUpdate(req.params.id, {
      patientId,
      name,
      phoneNo,
      address,
      symptoms,
      reason,
      admitDate,
      doctor,
      bedNumber
      // (Password and reports are not updated here.)
    });
    res.redirect(`/patient/${req.params.id}/dashboard`);
  } catch (err) {
    console.error(err);
    res.render('editPatient', { patient: req.body, error: 'Error updating patient details.' });
  }
});

// Logout route (clears session for this patient record)
app.get('/patient/:id/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect(`/patient/${req.params.id}`);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on ${process.env.BASE_URL || 'http://localhost:' + PORT}`);
});

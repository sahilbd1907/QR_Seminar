// // server.js
// require('dotenv').config();

// const express    = require('express');
// const mongoose   = require('mongoose');
// const session    = require('express-session');
// const bcrypt     = require('bcryptjs');
// const bodyParser = require('body-parser');
// const QRCode     = require('qrcode');
// const path       = require('path');

// // Require the patient model (ensure the file is named "patient.js" in the "models" folder)
// const Patient    = require('./models/patient');

// // Require the patient model (ensure the file is named "patient.js" in the "models" folder)
// const Prescription    = require('./models/prescription');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // (Optional) Set Mongoose strictQuery to suppress deprecation warnings.
// // Change to true if you prefer strict mode.
// mongoose.set('strictQuery', false);

// // Use the environment variable MONGODB_URI if available; otherwise fallback to local connection.
// // IMPORTANT: On Render, MONGODB_URI must be set to your Atlas connection string.
// const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/patientQR';

// mongoose
//   .connect(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   })
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // Middleware
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'public')));
// app.set('view engine', 'ejs');

// // Session middleware
// // Note: MemoryStore is not recommended for production; consider using a robust store (like connect-mongo) for production deployments.
// app.use(session({
//   secret: 'someSuperSecretKey', // Change this for production
//   resave: false,
//   saveUninitialized: false
// }));

// // Middleware to protect routes (only allow access if authenticated for this patient record)
// function checkAuth(req, res, next) {
//   if (req.session && req.session.authenticated && req.session.patientId === req.params.id) {
//     next();
//   } else {
//     res.redirect(`/patient/${req.params.id}`);
//   }
// }

// // Routes

// // Home – redirect to the add patient form
// app.get('/', (req, res) => {
//   res.redirect('/add');
// });

// // Render form to add a new patient record
// app.get('/add', (req, res) => {
//   res.render('addPatient', { error: null });
// });

// // Route to view all patients in the database
// app.get('/patients/all', async (req, res) => {
//   try {
//     const patients = await Patient.find({});
//     res.render('allPatients', { patients });
//   } catch (err) {
//     console.error(err);
//     res.send('Error retrieving patients.');
//   }
// });

// // Handle submission of patient data
// app.post('/patients', async (req, res) => {
//   try {
//     // Extract fields from the form
//     const { patientId, name, phoneNo, address, symptoms, reason, admitDate, doctor, bedNumber, accessPassword } = req.body;
//     // Hash the access password securely using bcryptjs
//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(accessPassword, saltRounds);
    
//     // Create and save a new patient record
//     const newPatient = new Patient({
//       patientId,
//       name,
//       phoneNo,
//       address,
//       symptoms,
//       reason,
//       admitDate,
//       doctor,
//       bedNumber,
//       accessPassword: hashedPassword
//       // (For reports, add file-upload handling later if needed)
//     });
//     await newPatient.save();
    
//     // Determine the base URL for QR code generation:
//     // Use the BASE_URL environment variable if set (for example, your Render URL),
//     // otherwise fallback to localhost (useful for local testing).
//     const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
//     const patientUrl = `${baseUrl}/patient/${newPatient._id}`;
    
//     // Render the QR code page
//     res.render('qr', { patientUrl });
//   } catch (err) {
//     console.error(err);
//     res.render('addPatient', { error: 'Error creating patient record. Please try again.' });
//   }
// });

// // Optional endpoint to generate a QR code image on the server
// app.get('/qrcode/:id', async (req, res) => {
//   try {
//     const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
//     const patientUrl = `${baseUrl}/patient/${req.params.id}`;
//     const qrCodeData = await QRCode.toDataURL(patientUrl);
//     res.send(`<img src="${qrCodeData}" alt="QR Code">`);
//   } catch (err) {
//     console.error(err);
//     res.send('Error generating QR code.');
//   }
// });

// // Patient record access page – prompts for a password
// app.get('/patient/:id', (req, res) => {
//   res.render('passwordPrompt', { patientId: req.params.id, error: null });
// });

// // Process the password submission and log the user in
// app.post('/patient/:id/login', async (req, res) => {
//   try {
//     const { password } = req.body;
//     const patient = await Patient.findById(req.params.id);
//     if (!patient) {
//       return res.send('Patient record not found.');
//     }
//     const match = await bcrypt.compare(password, patient.accessPassword);
//     if (match) {
//       req.session.authenticated = true;
//       req.session.patientId = req.params.id;
//       res.redirect(`/patient/${req.params.id}/dashboard`);
//     } else {
//       res.render('passwordPrompt', { patientId: req.params.id, error: 'Incorrect password. Try again.' });
//     }
//   } catch (err) {
//     console.error(err);
//     res.send('Error during login.');
//   }
// });

// // Dashboard: Shows two options – view or edit details
// app.get('/patient/:id/dashboard', checkAuth, (req, res) => {
//   res.render('dashboard', { patientId: req.params.id });
// });

// // View patient details (read-only)
// app.get('/patient/:id/view', checkAuth, async (req, res) => {
//   try {
//     const patient = await Patient.findById(req.params.id).populate({
//       path:"prescriptions",
//     });
//     if (!patient) {
//       return res.send('Patient not found.');
//     }
//     res.render('viewPatient', { patient });
//   } catch (err) {
//     console.error(err);
//     res.send('Error retrieving patient details.');
//   }
// });

// // Render the edit form pre-populated with the patient’s details
// app.get('/patient/:id/edit', checkAuth, async (req, res) => {
//   try {
//     const patient = await Patient.findById(req.params.id);
//     if (!patient) {
//       return res.send('Patient not found.');
//     }
//     res.render('editPatient', { patient, error: null });
//   } catch (err) {
//     console.error(err);
//     res.send('Error retrieving patient details for editing.');
//   }
// });

// // Process the submitted edits
// app.post('/patient/:id/edit', checkAuth, async (req, res) => {
//   try {
//     const { patientId, name, phoneNo, address, symptoms, reason, admitDate, doctor, bedNumber } = req.body;
//     await Patient.findByIdAndUpdate(req.params.id, {
//       patientId,
//       name,
//       phoneNo,
//       address,
//       symptoms,
//       reason,
//       admitDate,
//       doctor,
//       bedNumber
//       // (Password and reports are not updated here.)
//     });
//     res.redirect(`/patient/${req.params.id}/dashboard`);
//   } catch (err) {
//     console.error(err);
//     res.render('editPatient', { patient: req.body, error: 'Error updating patient details.' });
//   }
// });

// // Render the prescription form 
// app.get('/patient/:id/prescription', checkAuth, async (req, res) => {
//   try {
//     const patient = await Patient.findById(req.params.id);
//     if (!patient) {
//       return res.send('Patient not found.');
//     }
//     res.render('prescription',{ patient, error: null });
//   } catch (err) {
//     console.error(err);
//     res.send('Error retrieving patient details for editing.');
//   }
// });

// // Process the prescription details
// app.post('/patient/:id/prescription', checkAuth, async (req, res) => {
//   try {
//     const { date, time, doctor, medication, dosage, instructions } = req.body;
//     const patientId = req.params.id;

//     const patient = await Patient.findOne({_id: patientId });
//         if (!patient) {
//             return res.status(404).json({ error: 'Patient not found' });
//         }

//     const newPrescription = new Prescription({
//         patientId,
//         date,
//         time,
//         doctor,
//         medication,
//         dosage,
//         instructions
//     });

//     const savedPrescription = await newPrescription.save();

//         // ✅ Push prescription ID into the patient's prescriptions array
//     patient.prescriptions.push(savedPrescription._id);
//     await patient.save();

//     res.redirect(`/patient/${req.params.id}/dashboard`);
// } catch (error) {
//   console.error(error);
//   res.render('prescription', { patient: req.body, error: 'Error updating patient details.' });
// }
// });

// // Logout route (clears session for this patient record)
// app.get('/patient/:id/logout', (req, res) => {
//   req.session.destroy(err => {
//     if (err) console.error(err);
//     res.redirect(`/patient/${req.params.id}`);
//   });
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running on ${process.env.BASE_URL || 'http://localhost:' + PORT}`);
// });
require('dotenv').config();

const express    = require('express');
const mongoose   = require('mongoose');
const session    = require('express-session');
const bcrypt     = require('bcryptjs');
const bodyParser = require('body-parser');
const path       = require('path');
const { exec }   = require('child_process');

// Require models (adjust file names to match your repository’s case)
const Patient       = require('./models/Patient');
const Prescription  = require('./models/prescription');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB (either local or via MONGODB_URI)
mongoose.set('strictQuery', false);
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/patientQR';
mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session middleware
app.use(session({
  secret: 'someSuperSecretKey', // Change for production
  resave: false,
  saveUninitialized: false
}));

// Authentication middleware for patient routes
function checkAuth(req, res, next) {
  if (req.session && req.session.authenticated && req.session.patientId === req.params.id) {
    return next();
  }
  res.redirect(`/patient/${req.params.id}`);
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

// Handle submission of patient data and generate custom 4SQR code (download version)
app.post('/patients', async (req, res) => {
  try {
    const { patientId, name, phoneNo, address, symptoms, reason, admitDate, doctor, bedNumber, accessPassword } = req.body;
    const hashedPassword = await bcrypt.hash(accessPassword, 10);

    // Create and save the new patient record
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
    });
    await newPatient.save();

    // Build the patient URL (using BASE_URL if set)
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const patientUrl = `${baseUrl}/patient/${newPatient._id}`;

    // Build the command to run your Python 4SQR generator.
    // The Python script now takes two arguments: the patient URL and the cell_size.
    // It returns a base64-encoded PNG image on stdout.
    const pythonScriptPath = path.join(__dirname, '4sqr_encoder.py');
    const cellSize = 100;
    const cmd = `python "${pythonScriptPath}" "${patientUrl}" ${cellSize}`;
    console.log("Running command:", cmd);

    // Execute the Python command (increase maxBuffer if needed)
    exec(cmd, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error("Error generating 4SQR:", error);
        console.error("stderr:", stderr);
        console.error("stdout:", stdout);
        return res.render('qr', { patientUrl, qrCodeUrl: null, error: 'Error generating QR code.' });
      }
      console.log("Python stdout:", stdout);
      const base64Data = stdout.trim();
      // Convert base64 string to a binary Buffer
      const imgBuffer = Buffer.from(base64Data, 'base64');
      // Set headers to force a download as "4sqr.png"
      res.setHeader('Content-Disposition', 'attachment; filename=4sqr.png');
      res.setHeader('Content-Type', 'image/png');
      res.send(imgBuffer);
    });
  } catch (err) {
    console.error(err);
    res.render('addPatient', { error: 'Error creating patient record. Please try again.' });
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
    if (!patient) return res.send('Patient record not found.');
    const match = await bcrypt.compare(password, patient.accessPassword);
    if (match) {
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

// Dashboard: Shows options to view or edit details
app.get('/patient/:id/dashboard', checkAuth, (req, res) => {
  res.render('dashboard', { patientId: req.params.id });
});

// View patient details (read-only)
app.get('/patient/:id/view', checkAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate({ path: "prescriptions" });
    if (!patient) return res.send('Patient not found.');
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
    if (!patient) return res.send('Patient not found.');
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
    });
    res.redirect(`/patient/${req.params.id}/dashboard`);
  } catch (err) {
    console.error(err);
    res.render('editPatient', { patient: req.body, error: 'Error updating patient details.' });
  }
});

// Render the prescription form 
app.get('/patient/:id/prescription', checkAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.send('Patient not found.');
    }
    res.render('prescription', { patient, error: null });
  } catch (err) {
    console.error(err);
    res.send('Error retrieving patient details for editing.');
  }
});

// Process the prescription details
app.post('/patient/:id/prescription', checkAuth, async (req, res) => {
  try {
    const { date, time, doctor, medication, dosage, instructions } = req.body;
    const patientId = req.params.id;
    const patient = await Patient.findOne({ _id: patientId });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const newPrescription = new Prescription({
      patientId,
      date,
      time,
      doctor,
      medication,
      dosage,
      instructions
    });

    const savedPrescription = await newPrescription.save();

    // Push prescription ID into the patient's prescriptions array
    patient.prescriptions.push(savedPrescription._id);
    await patient.save();

    res.redirect(`/patient/${req.params.id}/dashboard`);
  } catch (error) {
    console.error(error);
    res.render('prescription', { patient: req.body, error: 'Error updating patient details.' });
  }
});

// Logout route – clears session for the patient record
app.get('/patient/:id/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect(`/patient/${req.params.id}`);
  });
});

// Bind to all interfaces for deployment (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on ${process.env.BASE_URL || 'http://0.0.0.0:' + PORT}`);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv')

dotenv.config({ path: "config.env" })
const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json()); // Simplified to use express.json()
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect("mongodb+srv://hemanthvijay02:AfMS7RxUtTdXonLd@cluster0.6a9ye.mongodb.net/ems")
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Define a schema and model
const employeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  designation: String,
  gender: String,
  courses: [String],
  image: String
}, {
  timestamps: true // Added timestamps for consistency
});

const Employee = mongoose.model('Employee', employeeSchema);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });


// Create & Save Employee
app.post('/create', upload.single('image'), async (req, res) => {
  try {
    const newEmployee = new Employee({
      ...req.body,
      image: req.file ? req.file.path : null
    });
    await newEmployee.save();
    res.status(201).json({ success: true, message: 'Employee added successfully', data: newEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding employee', error });
  }
});

// Read all Employees
app.get('/view', async (req, res) => {
  try {
    const employees = await Employee.find({});
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching employees', error });
  }
});

// Read a single Employee by ID
app.get('/view/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (employee) {
      res.json({ success: true, data: employee });
    } else {
      res.status(404).json({ success: false, message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching employee', error });
  }
});

// Update & Save Employee
app.put('/edit', upload.single('image'), async (req, res) => {
  try {
    const updatedData = {
      ...req.body,
      image: req.file ? req.file.path : req.body.image
    };
    const employee = await Employee.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (employee) {
      res.json({ success: true, message: 'Employee updated successfully', data: employee });
    } else {
      res.status(404).json({ success: false, message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating employee', error });
  }
});

// Delete Employee
app.delete('/delete/:id', async (req, res) => {
  try {
    const result = await Employee.findByIdAndDelete(req.params.id);
    if (result) {
      res.json({ success: true, message: 'Employee deleted successfully', data: result });
    } else {
      res.status(404).json({ success: false, message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting employee', error });
  }
});

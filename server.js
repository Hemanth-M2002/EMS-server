const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;

// Configure environment variables
dotenv.config();


const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));

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
  image: [String]
}, {
  timestamps: true
});


const Employee = mongoose.model('Employee', employeeSchema);

// Multer configuration for handling file uploads
const storage = multer.memoryStorage(); // Use memory storage for direct upload to Cloudinary
const upload = multer({ storage: storage });

// Helper function to upload image to Cloudinary
const uploadToCloudinary = (buffers) => {
  return Promise.all(buffers.map(buffer => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (result) {
            resolve(result.secure_url);
          } else {
            reject(error);
          }
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });
  }));
};


// Create & Save Employee
app.post('/create', upload.array('images'), async (req, res) => {
  try {
    let imageUrls = [];

    if (req.files) {
      imageUrls = await uploadToCloudinary(req.files.map(file => file.buffer));
    }

    const newEmployee = new Employee({
      ...req.body,
      images: imageUrls
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
app.put('/edit/:id', upload.array('images'), async (req, res) => {
  try {
    let imageUrls = req.body.images || [];

    if (req.files) {
      const newImageUrls = await uploadToCloudinary(req.files.map(file => file.buffer));
      imageUrls = [...imageUrls, ...newImageUrls];
    }

    const updatedData = {
      ...req.body,
      images: imageUrls
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
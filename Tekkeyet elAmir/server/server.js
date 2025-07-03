require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const moment = require('moment-timezone');

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Database Models
const Reservation = mongoose.model('Reservation', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    guests: { type: Number, required: true, min: 1, max: 20 },
    requests: String,
    createdAt: { type: Date, default: Date.now }
}));

const Table = mongoose.model('Table', new mongoose.Schema({
    capacity: { type: Number, default: 4 }
}));

// Enhanced MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://siwaAdmin:yourPassword@reservations.7eyucdr.mongodb.net/siwaDB?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// API Endpoints
app.get('/api/availability/:date', async (req, res) => {
    try {
        const date = moment.tz(req.params.date, 'Africa/Cairo').startOf('day').toDate();
        const reservations = await Reservation.find({
            date: {
                $gte: date,
                $lt: moment(date).add(1, 'day').toDate()
            }
        });

        const tables = await Table.estimatedDocumentCount();
        const timeSlots = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
        const availability = {};

        timeSlots.forEach(slot => {
            const reserved = reservations.filter(r => r.time === slot).length;
            availability[slot] = {
                available: tables - reserved,
                total: tables
            };
        });

        res.json(availability);
    } catch (err) {
        console.error('Error checking availability:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/reservations', async (req, res) => {
    try {
        const reservation = new Reservation({
            ...req.body,
            date: moment.tz(req.body.date, 'Africa/Cairo').toDate()
        });

        await reservation.save();
        res.status(201).json(reservation);
    } catch (err) {
        console.error('Booking failed:', err);
        res.status(400).json({
            error: err.name === 'ValidationError'
                ? 'Invalid data provided'
                : 'Booking failed'
        });
    }
});

app.get('/api/reservations', async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .sort({ date: 1 })
            .lean();
        res.json(reservations);
    } catch (err) {
        console.error('Error fetching reservations:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        mongoose.connection.close();
        console.log('Server shut down gracefully');
    });
});
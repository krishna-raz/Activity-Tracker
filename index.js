const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB Atlas
const mongoURI = 'mongodb+srv://admin:demo@cluster0.oj9mebk.mongodb.net/activity_tracker?retryWrites=true&w=majority';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Create a schema for activity data
const activitySchema = new mongoose.Schema({
  url: String,
  startTime: Date,
  endTime: Date,
  duration: Number, // in seconds
  count: { type: Number, default: 1 } // Count of times the URL has been opened
});

const Activity = mongoose.model('Activity', activitySchema);

// Route to store activity log
app.post('/api/activity', async (req, res) => {
  try {
    const activities = req.body.data;

    // Merging activities in case of the same URL
    for (const activity of activities) {
      await Activity.findOneAndUpdate(
        { url: activity.url },
        {
          $set: {
            startTime: activity.startTime,
            endTime: activity.endTime,
            duration: activity.duration,
          },
          $inc: { count: activity.count }
        },
        { upsert: true }
      );
    }

    res.status(201).send('Activity logged successfully.');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// API route to fetch all activities and render the dashboard using EJS
app.get('/dashboard', async (req, res) => {
  try {
    const activities = await Activity.find().sort({ startTime: -1 }); // Sort by most recent
    res.render('dashboard', { activities });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update profile
router.post('/', async (req, res) => {
  try {
    const { 
      userId, 
      fullName, 
      jobTitle, 
      education,
      skills, 
      certifications, 
      careerGoals, 
      recentActivities 
    } = req.body;
    
    let profile = await Profile.findOne({ userId });
    
    if (profile) {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { userId },
        { 
          fullName,
          jobTitle,
          education,
          skills,
          certifications,
          careerGoals,
          recentActivities
        },
        { new: true }
      );
    } else {
      // Create new profile
      profile = new Profile({
        userId,
        fullName,
        jobTitle,
        education,
        skills,
        certifications,
        careerGoals,
        recentActivities
      });
      await profile.save();
    }
    
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 
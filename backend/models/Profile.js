const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  education: {
    degree: {
      type: String,
      required: true
    },
    field: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    graduationYear: {
      type: String,
      required: true
    }
  },
  skills: [{
    name: String,
    proficiency: Number
  }],
  certifications: [{
    name: String,
    issueDate: Date
  }],
  careerGoals: [String],
  recentActivities: [{
    title: String,
    date: Date,
    description: String
  }],
  memberSince: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Profile', profileSchema); 
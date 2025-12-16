const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },           
  description: { type: String, required: true },     
  date: { type: String, required: true },           
  time: { type: String, required: true },           
  category: { type: String, required: true },       
  college: { type: String, required: true },        
  location: { type: String, required: true },        
  prizes: { type: String },                         
  eligibility: { type: String },                    
  entryFee: { type: Number },                       
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"], //  "Active"
    default: "approved", // by defat ye hoga bhai
  },

  poster: { type: String },                         

  createdBy: {                                       
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
},
{
  // Automatically manages createdAt and updatedAt fields
  timestamps: true
});

module.exports = mongoose.model("Event", EventSchema);

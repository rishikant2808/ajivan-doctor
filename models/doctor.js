const mongoose = require("mongoose");
const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  time:{
    type: String,
    required: true,
  },
  hospital:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital"
  },
  image:{
    type: String,
  },
  specialization: {
    type: String,
    required: true,
  },
  Max_no_of_patient: {
    type: Number,
    required: true,
  },
  count_of_patient:{
    type: Number,
    default:0
  },
  fee:{
    type: Number
  },
  check_max_patient:{
    type:Boolean,
    default:false
  },
  available:{
    type:Boolean,
    default:true
  },
  booked_info:[{
    booking_date:{
      type:String
    },
    visiting_date:{
      type:String
    },
    patient_info:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient"
      } 
  }
  ]
});

module.exports = mongoose.model("Doctor", doctorSchema, "doctor");

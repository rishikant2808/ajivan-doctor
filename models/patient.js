const mongoose = require("mongoose");
const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    //required: true,
  },

  email : {
    type: String,
    required: true
},

password: {
    type: String,
    required: true
},

address : {
  type: String,
  required: true
},

city : {
  type: String,
  required: true
},

state : {
  type: String,
  required: true
},
booking_info:[{
  booking_date:{
    type:String
  },
  visiting_date:{
    type:String
  },
  doctor_info:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor"
    }
}
]

});

module.exports = mongoose.model("Patient", patientSchema, "patient");

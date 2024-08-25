const mongoose = require('mongoose');
const hospitalSchema = new mongoose.Schema({
    name: {
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
      phone:{
        type: Number,
      },
      image: {
        type: String,
      },

    email : {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    doctors : [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Doctor"
        }
    ],

    //Overall report
    complete_record:[{
      date:{
        type:Date
      },
      record_id:[
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Record"
        }
      ]
    }
    ],

    //Daily report i.e. tommowrow's booking
    today_record :  {
      date:{
        type:Date
      },
      record_id:[
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Record"
        }
      ]
    }



});

module.exports = new mongoose.model('hospital',hospitalSchema);
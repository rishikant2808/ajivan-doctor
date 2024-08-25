const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const hospital = require("../models/hospital.js");
const patient = require("../models/patient.js");
const Doctor = require("../models/doctor.js");
const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const mongoose = require("mongoose");
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

var multipleUpload = upload.fields([{ name: 'image', maxCount: 1 }]);
const { findById, db } = require("../models/hospital.js");
const doctor = require("../models/doctor.js");

router.use(cookieParser("secret"));
router.use(
  session({
    secret: "secret",
    maxAge: 3600000,
    resave: true,
    saveUninitialized: true,
  })
);
router.use(passport.initialize());
router.use(passport.session());

router.use(flash());
router.use(function (req, res, next) {
  res.locals.success_message = req.flash("success_message");
  res.locals.error_message = req.flash("error_message");
  res.locals.error = req.flash("error");
  next();
});

const ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    res.set(
      "Cache-Control",
      "no-cache,private,no-store,must-revalidate,post-check=0,pre-check=0"
    );
    return next();
  } else res.redirect("/hospitalLogin");
};

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.use(express.json());
router.use(express.urlencoded());

router.get("/", (req, res) => {
  res.render("landingPage");
});

router.get("/hospitalRegister", (req, res) => {
  res.render("hospitalRegister");
});

router.post("/hospitalRegister", multipleUpload, async (req, res) => {
  const result = await cloudinary.uploader.upload(req.files['image'][0].path);
  let { name, email, address, city, phone, state, password, confirmPassword } = req.body;
  if (!name || !email || !password || !confirmPassword || !address || !city || !state || !phone) {
    err = "Please fill all the fields";
    res.render("hospitalRegister", { err: err });
  }
  if (password != confirmPassword) {
    err = "Passwords dont match";
    res.render("hospitalRegister", {
      err: err,
      email: email,
      name: name,
      password: password,
      address: address,
      city: city,
      phone: phone,
      state: state
    });
  }
  if (typeof err == "undefined") {
    hospital.findOne({ email: email }, async (err, data) => {
      if (err) throw err;
      if (data) {
        err = "Hospital already registered";
        res.render("hospitalRegister", { name: name, err: err });
      } else {
        bcrypt.genSalt(10, (err, salt) => {
          if (err) throw err;
          bcrypt.hash(password, salt, async (err, hash) => {
            if (err) throw err;
            password = hash;
            let hosp = new hospital({
              name: name,
              email: email,
              address: address,
              city: city,
              phone: phone,
              state: state,
              password: password,
              confirmPassword: confirmPassword,
              image: result.secure_url
            });

            await hosp.save((err, data) => {
              if (err) console.log(err);
              req.flash("success_message", "Please login to continue");
              res.redirect("/hospitallogin");
            });
            // hospital({
            //   name,
            //   email,
            //   password,
            //   address,
            //   city,
            //   state,
            //   pin
            // }).save((err, data) => {
            //   if (err) throw err;
            //   req.flash("success_message", "Please Login to Continue");
            //   res.redirect("/hospitallogin");
            // });
          });
        });
      }
    });
  }
});

var localStrategy = require("passport-local").Strategy;
passport.use(
  "hospital",
  new localStrategy({ usernameField: "email" }, (email, password, done) => {
    hospital.findOne({ email: email }, (err, data) => {
      if (err) throw err;
      if (!data) {
        return done(null, false, { message: "Hospital Not Registered" });
      }
      bcrypt.compare(password, data.password, (err, match) => {
        if (err) return done(null, false);
        if (!match)
          return done(null, false, { message: "Password is Incorrect" });
        if (match) return done(null, data);
      });
    });
  })
);


/*=======Patient Login=======*/

router.get("/patientRegister", (req, res) => {
  res.render("patientRegister");
});

router.post("/patientRegister", (req, res) => {
  let { name, email, address, city, state, password, confirmPassword } = req.body;
  if (!name || !email || !password || !confirmPassword || !address || !city || !state) {
    err = "Please fill all the fields";
    res.render("patientRegister", { err: err });
  }
  if (password != confirmPassword) {
    err = "Passwords dont match";
    res.render("patientRegister", {
      err: err,
      email: email,
      name: name,
      password: password,
      address: address,
      city: city,
      state: state
    });
  }
  if (typeof err == "undefined") {
    patient.findOne({ email: email }, function (err, data) {
      if (err) throw err;
      if (data) {
        err = "Patient already registered";
        res.render("patientRegister", { name: name, err: err });
      } else {
        bcrypt.genSalt(10, (err, salt) => {
          if (err) throw err;
          bcrypt.hash(password, salt, (err, hash) => {
            if (err) throw err;
            password = hash;
            patient({
              name,
              email,
              password,
              address,
              city,
              state
            }).save((err, data) => {
              if (err) throw err;
              req.flash("success_message", "Please Login to Continue");
              console.log(data);
              res.redirect("/patientlogin");
            });
          });
        });
      }
    });
  }
});

var localStrategy = require("passport-local").Strategy;
passport.use(
  "patient",
  new localStrategy({ usernameField: "email" }, (email, password, done) => {
    patient.findOne({ email: email }, (err, data) => {
      if (err) throw err;
      if (!data) {
        return done(null, false, { message: "Patient Not Registered" });
      }
      bcrypt.compare(password, data.password, (err, match) => {
        if (err) return done(null, false);
        if (!match)
          return done(null, false, { message: "Password is Incorrect" });
        if (match) return done(null, data);
      });
    });
  })
);

router.get("/patientLogin", (req, res) => {
  res.render("patientLogin");
});

router.post("/patientLogin", (req, res, next) => {
  passport.authenticate("patient", {
    failureRedirect: "/patientLogin",
    successRedirect: "/patientDashboard",
    failureFlash: true,
  })(req, res, next);
});

router.get('/patientLogout', (req, res, next) => {
  req.logout(req.user, err => {
    if (err) return next(err);
    res.redirect('/');
  });

})

router.get("/patientDashboard", (req, res) => {
  console.log(req.user.city + " got")
  // db.collection("hospitals").find({city:new RegExp(req.user.city,"i")}).toArray(function(err,data){


  //   console.log(data);
  //   res.render("patientDashboard",{hospitals:data});
  // })
  hospital.find({ city: req.user.city }).populate({ path: "doctors", model: Doctor }).exec(function (err, data) {
    if (err) res.send(err);
    else {
      console.log(data);
      //res.send(data);
      res.render("patientDashboard", { hospitals: data, user: req.user });
    }
  })

});

router.get("/patient_bookings/:user_id", (req, res) => {
  patient.findById(req.params.user_id).populate({ path: "booking_info.doctor_info", model: Doctor, populate: { path: "hospital", model: hospital } }).exec((err, patient) => {
    if (err) console.log(err);
    console.log(patient);
    res.render("patient_bookings", { patient: patient });
  })
})

passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
  hospital.findById(id, function (err, user) {
    if (err) cb(err);
    if (user) cb(null, user);
    else {
      patient.findById(id, function (err, user) {
        if (err) cb(err);
        cb(null, user);
      })
    }
  });
});

router.get("/c", (req, res) => {
  res.send("Success");
})

/*=======Patient Login End=========*/
router.get("/hospitalLogin", (req, res) => {
  res.render("hospitalLogin");
});

router.post("/hospitalLogin", (req, res, next) => {
  passport.authenticate("hospital", {
    failureRedirect: "/hospitalLogin",
    successRedirect: "/hospitalDashboard",
    failureFlash: true,
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout(req.user, err => {
    if (err) return next(err);
    res.redirect("/");
  });

});

router.get("/hospitalDashboard", ensureAuthenticated, (req, res) => {
  // doctors.find({}.populate, (err,data)=>{
  //     res.render('hospitalDashboard', {doctor: data});
  // })
  hospital
    .findOne({ _id: req.user._id })
    .populate({ path: "doctors", model: Doctor })
    .exec(function (err, data) {
      if (err) throw err;
      else {
        console.log(data.doctors);
        res.render("hospitalDashboard", { user: data });
      }
    });

  // hospital.findOne({_id:req.user._id}).populate({path:"doctors",model:Doctor}).then(user => {
  //     res.json(user);
  //  });

  // let hospital_id = req.user._id;
  // res.render('hospitalDashboard', {user:req.user});
  // console.log(req.user);
});

router.get("/hospital_booking", (req, res) => {
  hospital.findById(req.user._id).populate({ path: "doctors", model: Doctor, populate: { path: "booked_info.patient_info", model: patient } }).exec(function (err, data) {
    if (err) console.log(err);
    else {
      res.render("hospital_booking", { data: data });
    }
  })
})

router.get("/get", ensureAuthenticated, (req, res) => {
  hospital
    .findOne({ _id: req.user._id })
    .populate({ path: "doctors", model: Doctor })
    .exec(function (err, data) {
      if (err) throw err;
      else {
        console.log(data.doctors);
        res.send(data);
      }
    });
});

router.get("/doctor/add/:id", ensureAuthenticated, (req, res) => {
  res.render("addDoctor", { user: req.user });
});

router.post("/add/:id", ensureAuthenticated, multipleUpload, async (req, res) => {
  const result = await cloudinary.uploader.upload(req.files['image'][0].path);
  const fee = req.body.fee;
  const name = req.body.name;
  const spec = req.body.specialization;
  const patient_no = req.body.max_patient_no;
  const time=req.body.start_time+" to "+req.body.end_time;
  console.log(req.body);

  hospital.findById(req.params.id, async (err, hospital) => {
    if (err) throw err;
    else {
      let doct = new Doctor({
        name: name,
        specialization: spec,
        fee: fee,
        Max_no_of_patient: patient_no,
        hospital: req.params.id,
        image: result.secure_url,
        time:time
      });
      await doct.save((err, data) => {
        if (err) console.log(err);
        else {
          console.log(data);
          hospital.doctors.push(data);
          hospital.save();
        }
      })
      // Doctor.create(
      //   {
      //     registration: reg,
      //     name: name,
      //     specialization: spec,
      //     Max_no_of_patient: patient_no,
      //     hospital:req.params.id,
      //     image:result.secure_url
      //   },
      //   (err, data) => {
      //     if (err) throw err;
      //     else {
      //       console.log(data);
      //       hospital.doctors.push(data);
      //       hospital.save();
      //     }
      //     // if(data){
      //     //     err ='Doctor already registered';
      //     //     res.render('addDoctor');
      //     // }
      //   }
      // );
    }
  });

  // hos.doctors.push(doc._id);
  res.redirect("/hospitalDashboard");
});

router.post("/book", check, addDataToPatient, (req, res) => {
  // res.send(req.query.doctor_id);
  var patient_id = req.query.patient_id;
  var booking_date = new Date();
  var d = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  var visiting_date = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
  doctor.findById(req.query.doctor_id, (err, doctor) => {
    var obj = {
      visiting_date: visiting_date,
      booking_date: booking_date,
      patient_info: patient_id
    }
    doctor.booked_info.push(obj);
    doctor.count_of_patient++;
    doctor.save();
  });
  patient.findById(patient_id).populate({ path: "booking_info.doctor_info", model: Doctor, populate: { path: "hospital", model: hospital } }).exec((err, patient) => {
    if (err) console.log(err);
    console.log(patient);
    res.render("patient_bookings", { patient: patient });
  })

})

router.post('/createOrder/:amt', (req, res) => {
  let options = {
    amount: req.params.amt * 100,
    currency: "INR",
  }
  razorpay.orders.create(options, (err, order) => {
    console.log(order);
    res.json(order);
  })
});

router.post('/isComplete/:doctorid/:hospitalid/:patientid', check, addDataToPatient, (req, res) => {
  razorpay.payments.fetch(req.body.razorpay_payment_id).then((doc) => {
    if (doc.status == 'captured') {
      var patient_id = req.params.patientid;
      var booking_date = new Date();
      var d = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
      var visiting_date = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
      doctor.findById(req.params.doctorid, (err, doctor) => {
        var obj = {
          visiting_date: visiting_date,
          booking_date: booking_date,
          patient_info: patient_id
        }
        doctor.booked_info.push(obj);
        doctor.count_of_patient++;
        doctor.save();
      });
      patient.findById(patient_id).populate({ path: "booking_info.doctor_info", model: Doctor, populate: { path: "hospital", model: hospital } }).exec((err, patient) => {
        if (err) console.log(err);
        console.log(patient);
        res.render("patient_bookings", { patient: patient });
      })
    }
  });

})

router.get("/test", function (req, res) {

  hospital.findById(req.user._id).populate({ path: "doctors", model: Doctor }).exec(function (err, data) {
    if (err) res.send(err);
    else {
      res.render("test", { data: data });
    }
  })
})

// setInterval(function() {
//   doctor.updateMany({},{$set:{name:"eaehrrs",Max_no_of_patient:77}},function(err,data){
//     // data.forEach(function(data){
//     //   data.Max_no_of_patient--;
//     // })
//     console.log(data);
//   })
//   doctor.find({},function(err,data){
//     // data.forEach(function(data){
//     //   data.Max_no_of_patient--;
//     // })
//     console.log(data);
//   })
// }, 60000);

function help() {
  console.log("hello");
}

function check(req, res, next) {
  doctor.findById(req.params.doctorid, (err, doctor) => {
    if (err) res.send(err);
    if (doctor.count_of_patient === doctor.Max_no_of_patient) {
      res.send("Aukad se bahar hogaya");
      doctor.check_max_patient = true;
      doctor.save();
    }
    else next();
  })
}

function addDataToPatient(req, res, next) {
  var doctor_id = req.params.doctorid;
  var booking_date = new Date();
  var d = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  var visiting_date = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
  patient.findById(req.params.patientid, (err, patient) => {
    if (err) res.send(err);
    else {
      var obj = {
        visiting_date: visiting_date,
        booking_date: booking_date,
        doctor_info: doctor_id
      }
      patient.booking_info.push(obj);
      patient.save();
      console.log(patient);
      next();
    }
  })
}


router.get("/doctor/view/:id", (req, res) => {
  hospital.findById(req.params.id).populate({ path: "doctors", model: Doctor }).exec(function (err, data) {
    if (err) res.send(err);
    else {
      console.log(data);
      //res.send(data);
      res.render("viewDoctor", { hospitals: data, user: req.user });
    }
  })
});

module.exports = router;

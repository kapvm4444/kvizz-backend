const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

//modeling the database collection
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "User must enter name"],
    },
    email: {
      type: String,
      require: [true, "User must enter email"],
      unique: [true, "Email already in use"],
      lowercase: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },
    mobile: {
      type: Number,
      validate: {
        validator: function (val) {
          return /^\d{10}$/.test(val);
        },
        message: "Enter a valid mobile number",
      },
    },
    username: String,
    photo: {
      type: String,
      default: "users/default.jpg",
    },
    password: {
      type: String,
      require: [true, "User must enter password"],
      minlength: [8, "Password Length must be at least 8 characters"],
      maxlength: 64,
      select: false,
    },
    passwordConfirm: {
      type: String,
      require: [true, "User must enter password"],
      minlength: 8,
      maxlength: 64,
      validate: {
        validator: function (val) {
          return this.password === val;
        },
        message: "Password and Password Confirm must be same",
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    stats: {
      totalScore: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      gamesPlayed: {
        type: Number,
        default: 0,
      },
    },
    // ownedQuizzes: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: "Quiz",
    //   },
    // ],
    playedQuiz: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "GameSession",
      },
    ],
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    deletedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    settings: {
      darkMode: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.index({ "stats.totalScore": -1 });
userSchema.index({ createdAt: -1 });

/*
userSchema.virtual("ownedQuizzes", {
  ref: "Quiz",
  foreignField: "creator",
  localField: "_id",
  justOne: false,
});
*/

//LABEL
// HOOKS
//=> Password Encryption logic
userSchema.pre("save", async function (next) {
  //check if 'password' field is modified or not
  if (!this.isModified("password")) return next();

  //encrypting the password with hash and strength of 12 (higher the strength more CPU intensive and secure the password)
  this.password = await bcrypt.hash(this.password, 12);

  //deleting the passwordConfirm field as it is not necessary for the database (was for user verification only)
  this.passwordConfirm = undefined;
});

//=> set password changed at property dynamically
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//=> filter to get only active users
userSchema.pre(/^find/g, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//LABEL
// Methods
//creating an INSTANCE method for all the results objects
//use SchemaName.methods.<method-name>

//=> check if user entered password is correct or not (return false if not same)
userSchema.methods.checkPassword = async function (
  candidatePassword,
  userPassword,
) {
  //candidatePassword = password that is entered by user in forms (from req)
  //userPassword = password that is stored in db (actual password)

  //Use the 'bcrypt' package's compare method, which compares both strings even if either is encrypted
  return await bcrypt.compare(candidatePassword, userPassword);
};

//=> method to check if password is changed after the token generated or not
userSchema.methods.isPasswordChangedAfter = function (JWTTokenTime) {
  if (this.passwordChangedAt) {
    const passwordChangedTime = parseInt(
      this.passwordChangedAt.getTime() / 1000,
    );

    return JWTTokenTime < passwordChangedTime;
  }

  return false;
};

//=> getting the password reset token [simply generating and returning the token]
userSchema.methods.getPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

//=> creating the collection
const User = mongoose.model("User", userSchema);

module.exports = User;

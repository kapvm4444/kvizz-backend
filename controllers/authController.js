const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const { sendEmail } = require("../utils/email");

//Label
// utility methods
//creating a token [JWT Token]
const getJWTToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = getJWTToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  //send the cookie with 'res' object
  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

//Label
// Main handlers
//=>
// Signing up the user (first-time)
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  createSendToken(newUser, 201, req, res);
});

//=>
// logging in user and send jwt token
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1. check if password and email exists in req.body or not
  if (!email || !password)
    return next(new AppError("Please provide email and password both", 400));

  //2. check if user exist, and check if password is correct or not
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.checkPassword(password, user.password)))
    return next(new AppError("Email or Password incorrect", 401));

  //3. provide the jwt token
  createSendToken(user, 200, req, res);
});

//=>
// Protect some content from unauthorized access (simple checks if user logged in or not)
exports.protect = catchAsync(async (req, res, next) => {
  //1. Get the token and check if its there (from client, means in request)
  let token;
  if (req.cookies.jwt) token = req.cookies.jwt;
  else if (req.headers.authorization)
    token = req.headers.authorization.split(" ")[1];

  // if (!token) return next(new AppError("User belong to this Token is no longer exist, please log in again", 401))

  //2. Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3. check if user still exist
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError(
        "User belong to this Token is no longer exist, please log in again",
        401,
      ),
    );

  //4. check if user changed the password after the token was issued
  if (currentUser.isPasswordChangedAfter(decoded.iat))
    return next(
      new AppError("User Changed the password, please log in again", 401),
    );

  //Grant access to the protected content now
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//=>
// Check if user is logged in or not (no errors if not)
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      //1. Get the token and check if its there (from client, means in request)
      // 2. Verification of token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      //3. check if user still exist
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) return next();

      //4. check if user changed the password after the token was issued
      if (currentUser.isPasswordChangedAfter(decoded.iat)) return next();

      //Grant access to the protected content now
      res.locals.user = currentUser;
      return next();
    }
    return next();
  } catch (e) {
    return next();
  }
};

//=>
// Adding the restriction to the specific routes, we can use this on any route to restrict it from certain users
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You are not authorized to use this resource", 403),
      );

    next();
  };
};

//=>
// Forgot password module, used to send the request email to user for password reset link [send token for password reset]
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. Get the user based on the email provided from POST method
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError("There is no user with that email", 404));

  const email = user.email;
  //2. Generate the password reset token
  const passwordResetToken = user.getPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3.send the token to user's email
  try {
    await sendEmail(email, passwordResetToken, user.name);

    res.status(200).json({
      status: "success",
      message:
        "Token is sent through email, check your inbox and also spam folder",
      passwordResetToken,
    });
  } catch (e) {
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(e.errorMessage);
    console.log(e.stack);

    return next(
      new AppError(
        "There was an error sending the email, please try again later",
        500,
      ),
    );
  }
});

//=>
// reset password module, which actually resets the password using a resetToken
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. check if user available based on token
  const HashedResetToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: HashedResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("Token is Expired or invalid", 400));

  //2. if token is valid and there is a user, set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3. update the passwordChangedAt property [must be done on model side]
  //4. Log in the user with JWT
  createSendToken(user, 200, req, res);
});

//=>
// Update the user password without prompting forgot password [for logged in users]
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  //1. get the user from collection
  const user = await User.findById(req.user._id)
    .select("+password")
    .select("+passwordConfirm");
  if (!user)
    return next(new AppError("Invalid JWT token, please log in again", 400));

  console.log(req.body);
  const isPasswordCorrect = await user.checkPassword(
    currentPassword,
    user.password,
  );
  console.log(isPasswordCorrect);
  //2. check if password is correct or not
  if (!isPasswordCorrect)
    return next(new AppError("Your current password is invalid", 400));

  if (!currentPassword.length >= 8)
    return next(
      new AppError("New Password must be at least 8 characters", 400),
    );

  if (currentPassword === newPassword)
    return next(
      new AppError("New password can not be same as the current Password", 400),
    );
  //3. if yes, then change the password
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  const updatedUser = await user.save();

  //4. log user in again with JWT
  createSendToken(updatedUser, 200, req, res);
});

//=>
// Logout the user
exports.logout = (req, res) => {
  res.cookie("jwt", "LoggedOut", {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: "success" });
};

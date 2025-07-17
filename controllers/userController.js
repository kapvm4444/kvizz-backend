const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const User = require('../models/userModel');
const multer = require('multer');
const sharp = require('sharp');

//Label
// Config

//=> Uploading user photo
// Configuring multer storage (includes file location and name) (Use this for directly storing the image to your public folder)
//const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users/');
//   },
//   filename: (req, file, cb) => {
//     const name = `user-${req.user._id}-${Date.now()}.${file.mimetype.split('/')[1]}`;
//     cb(null, name);
//   },
// });

//=> using memory storage for image compression and resize
const multerStorage = multer.memoryStorage();

//=>
// configuring file filter for image validation
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image, please try to upload an image'), false);
  }
};

//=>
// multer upload (object of multer which will actually upload the image to server)
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//=>
// actual method to upload a single file
exports.uploadUserPhoto = upload.single('photo');

//=>
// formating and processing the image (compression and resizing)
exports.formatUserPhoto = (req, res, next) => {
  if (req.file) {
    const filename = `user-${req.user._id}-${Date.now()}.jpeg`;
    req.file.filename = filename;

    sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 80 })
      .toFile(`public/img/users/${filename}`);
  }

  next();
};

//Label>
// utility methods

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//Label
// Main handlers

//=>
// Get Me - Get all the info of current user
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//=>
// Update the User Info [excluding password]
exports.updateMe = catchAsync(async (req, res, next) => {
  //1. create error if user try to update the password
  if (req.body.passwordConfirm || req.body.password)
    return next(
      new AppError(
        'You can not change your password here, use /update-password',
        400,
      ),
    );

  //2. Filter out the unwanted fields
  const filteredBody = filterObj(req.body, 'name', 'email'); //simply filters and give only values which are mentioned in arguments
  if (req.file) filteredBody.photo = req.file.filename;

  //3. Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    runValidators: true,
    new: true,
  });
  res.status(200).json({
    status: 'success',
    updatedUser,
  });
});

//=>
// Delete user [simply deactivate]
exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user._id, {
    active: false,
    deletedAt: Date.now(),
  });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

//=>
// GET - getting and reading the data from json
exports.getAllUsers = factory.getAll(User);

//=>
// Getting specific data from the json
exports.getUser = factory.getOne(User);

//=>
// POST - creating/adding new data to Json
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'err',
    message: 'This route is not valid! use /signup route instead',
  });
};

//=>
// PATCH - Updating the data in JSON file (Updating values, not the entire object) (not implementing because not used in real time)
exports.updateUser = factory.updateOne(User);

//=>
// DELETE - Deleting the data in JSON file (not implementing because not used in real time)
exports.deleteUser = factory.deleteOne(User);

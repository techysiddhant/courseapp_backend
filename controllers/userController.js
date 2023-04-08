import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import ErrorHandler from "../utils/errorHandler.js";
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { sendToken } from '../utils/sendToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';
import cloudinary from 'cloudinary';
import getDataUri from '../utils/dataUri.js';
import { Stats } from '../models/Stats.js';
export const register = catchAsyncError(async(req, res, next) => {
    const { name, email, password } = req.body;
    const file = req.file;

    if (!name || !email || !password || !file) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }

    let user = await User.findOne({ email });
    if (user) {
        return next(new ErrorHandler("User already exists", 409));
    }

    // console.log(file);
    const fileUri = getDataUri(file);

    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
    //upload file on cloudinary
    user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
        }
    });
    sendToken(res, user, "User Registered Successfully", 201);
});

export const login = catchAsyncError(async(req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    sendToken(res, user, `Welcome back, ${user.name}`, 200);
});

export const logout = catchAsyncError(async(req, res, next) => {
    res.status(200).cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: true,
        sameSite: "none"
    }).json({
        success: true,
        message: "Logged out successfully"
    });
    // res.clearCookie("token").status(200).json({
    //     success: true,
    //     message: "Logged out successfully"
    // });
});

export const getMyProfile = catchAsyncError(async(req, res, next) => {
    const user = await User.findById(req.user._id);

    res.status(200).json({
        success: true,
        user
    });
});
export const changePassword = catchAsyncError(async(req, res, next) => {

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }
    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
        return next(new ErrorHandler("Old Password is incorrect", 401));
    }
    user.password = newPassword;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password changed successfully"
    });
});

export const updateProfile = catchAsyncError(async(req, res, next) => {

    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
        success: true,

        message: "Profile updated successfully"
    });


});

export const updateProfilePicture = catchAsyncError(async(req, res, next) => {
    const user = await User.findById(req.user._id);
    const file = req.file;
    // console.log(file);
    const fileUri = getDataUri(file);

    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    user.avatar = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
    }
    await user.save();
    res.status(200).json({
        success: true,
        message: "Profile picture updated successfully"
    });
});

export const forgetPassword = catchAsyncError(async(req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return next(new ErrorHandler("User not found", 400));
    }
    const resetToken = user.getResetPasswordToken();
    //send token to user's email
    await user.save();
    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
    const message = `Click on the link to reset your password.${url}. If you have not requested this email, then ignore it.`;
    await sendEmail(user.email, "Course WebApp Password Reset", message);
    await user.save({ validateBeforeSave: false });
    res.status(200).json({
        success: true,
        message: `Reset Token has been sent to your email: ${user.email}`
    });
});

export const resetPassword = catchAsyncError(async(req, res, next) => {
    const { token } = req.params;

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },


    });
    if (!user) {
        return next(new ErrorHandler("Password reset token is invalid or has been expired", 401));
    }

    user.password = req.body.password;
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password reset successfully"
    });
});

export const addToPlaylist = catchAsyncError(async(req, res, next) => {
    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.body.id);

    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }
    const itemExist = user.playlist.find(item => item.course.toString() === course._id.toString());
    if (itemExist) {
        return next(new ErrorHandler("Course already exist in playlist", 409));
    }
    user.playlist.push({
        course: course._id,
        poster: course.poster.url
    });
    await user.save();

    res.status(200).json({
        success: true,
        message: "Course added to playlist successfully"
    });

});

export const removeFromPlaylist = catchAsyncError(async(req, res, next) => {
    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.query.id);

    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }
    const newPlaylist = user.playlist.filter((item) => {
        if (item.course.toString() !== course._id.toString()) {
            return item;
        }
    });
    user.playlist = newPlaylist;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Course removed to playlist successfully"
    });

});

export const getAllUsers = catchAsyncError(async(req, res, next) => {
    const users = await User.find({});


    res.status(200).json({
        success: true,
        users
    });

});
export const updateUserRole = catchAsyncError(async(req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }
    if (user.role === "user") {
        user.role = "admin";
    } else {
        user.role = "user";
    }
    await user.save();


    res.status(200).json({
        success: true,
        message: "User role updated successfully"
    });

});

export const deleteUser = catchAsyncError(async(req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    //cancel subscription
    await user.deleteOne();


    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });

});

export const deleteMyProfile = catchAsyncError(async(req, res, next) => {
    const user = await User.findById(req.user._id);

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    //cancel subscription
    await user.deleteOne();


    res.status(200).cookie("token", null, {
        expires: new Date(Date.now()),
    }).json({
        success: true,
        message: "User deleted successfully"
    });
});

User.watch().on("change", async() => {
    const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

    const subscription = await User.find({ "subscription.status": "active" });

    stats[0].subscription = subscription.length;
    stats[0].users = await User.countDocuments();
    stats[0].createdAt = new Date(Date.now());

    await stats[0].save();
});
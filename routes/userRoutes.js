import express from 'express';
import { register, login, logout, getMyProfile, changePassword, updateProfile, updateProfilePicture, forgetPassword, resetPassword, addToPlaylist, removeFromPlaylist, getAllUsers, updateUserRole, deleteUser, deleteMyProfile } from '../controllers/userController.js';
import { authorizedAdmin, isAuthenticated } from '../middlewares/auth.js';
import singleUpload from '../middlewares/multer.js';
const router = express.Router();




router.route('/register').post(singleUpload, register);
router.route('/login').post(login);
router.route('/logout').get(logout);
//get my profile 
router.route('/me').get(isAuthenticated, getMyProfile);
// delete my profile
router.route('/me').delete(isAuthenticated, deleteMyProfile);
// change password
router.route('/changepassword').put(isAuthenticated, changePassword);
//update Profile
router.route('/updateprofile').put(isAuthenticated, updateProfile);
//update Profile Picture
router.route('/updateprofilepicture').put(isAuthenticated, singleUpload, updateProfilePicture);
//forgot password
router.route('/forgetpassword').post(forgetPassword);
//reset password
router.route('/resetpassword/:token').put(resetPassword);
//add to playlist
router.route('/addtoplaylist').post(isAuthenticated, addToPlaylist);

// remove from playlist
router.route('/removefromplaylist').post(isAuthenticated, removeFromPlaylist);

// Admin Routes
router.route('/admin/users').get(isAuthenticated, authorizedAdmin, getAllUsers);
// update user role
router.route('/admin/user/:id').put(isAuthenticated, authorizedAdmin, updateUserRole).delete(isAuthenticated, authorizedAdmin, deleteUser);
export default router;
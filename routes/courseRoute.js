import express from 'express';
import { addLecture, createCourse, getAllCourses, getCourseLectures, deleteCourse, deleteLecture } from '../controllers/courseController.js';
import singleUpload from '../middlewares/multer.js';
import { authorizedAdmin, isAuthenticated, authorizeSubscribers } from '../middlewares/auth.js';
const router = express.Router();
// get All Courses with out lectures
router.route('/courses').get(getAllCourses);
// Create new course ?only admin
router.route('/createcourse').post(isAuthenticated, authorizedAdmin, singleUpload, createCourse);

// Add Lecture,Delete Lecture, Get Course Details

router.route('/course/:id').get(isAuthenticated, authorizeSubscribers, getCourseLectures).post(isAuthenticated, authorizedAdmin, singleUpload, addLecture).delete(isAuthenticated, authorizedAdmin, deleteCourse);

// delete lecture
router.route('/lecture').delete(isAuthenticated, authorizedAdmin, deleteLecture);
export default router;
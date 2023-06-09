import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import { Course } from '../models/Course.js';
import { Stats } from '../models/Stats.js';
import getDataUri from '../utils/dataUri.js';
import ErrorHandler from '../utils/errorHandler.js';
import cloudinary from 'cloudinary';
import ImageKit from 'imagekit';

export const getAllCourses = catchAsyncError(async(req, res, next) => {
    const keyword = req.query.keyword || "";
    const category = req.query.category || "";
    const courses = await Course.find({
        title: { $regex: keyword, $options: "i" },
        category: { $regex: category, $options: "i" },
    }).select("-lectures");
    res.status(200).json({
        success: true,
        courses,
    });
});

export const createCourse = catchAsyncError(async(req, res, next) => {

    const { title, description, category, createdBy } = req.body;
    if (!title || !description || !category || !createdBy) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }
    const imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
    const file = req.file;
    // console.log(file);
    const fileUri = getDataUri(file);

    // const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
    const mycloud = await imagekit.upload({
        file: fileUri.content,
        fileName: file.originalname
    }, );

    await Course.create({
        title,
        description,
        category,
        createdBy,
        poster: {
            public_id: mycloud.fileId,
            url: mycloud.url,
        }

    });
    res.status(201).json({
        success: true,
        message: "Course created successfully. You can add Lectures Now",

    });
});

export const getCourseLectures = catchAsyncError(async(req, res, next) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }

    course.views += 1;
    await course.save();
    res.status(200).json({
        success: true,
        lectures: course.lectures,
    });
});
// max video size 100MB

export const addLecture = catchAsyncError(async(req, res, next) => {
    const { title, description } = req.body;
    const { id } = req.params;
    const file = req.file;
    const course = await Course.findById(id);

    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }
    const imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
    const fileUri = getDataUri(file);

    // const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    //     resource_type: "video",
    // });
    // uload using image kit
    const resp = await imagekit.upload({
            file: fileUri.content,
            fileName: `${Date.now()}-${file.originalname}`,
        }

    );
    // console.log(resp);

    course.lectures.push({
        title,
        description,
        video: {
            public_id: resp.fileId,
            url: resp.url,
        }
    });

    course.numOfVideos = course.lectures.length;
    await course.save();
    res.status(200).json({
        success: true,
        message: "Lecture added successfully",
    });
});

export const deleteCourse = catchAsyncError(async(req, res, next) => {

    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }
    const imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
    // await cloudinary.v2.uploader.destroy(course.poster.public_id);
    await imagekit.deleteFile(course.poster.public_id);
    for (let i = 0; i < course.lectures.length; i++) {
        const singleLecture = course.lectures[i];
        await imagekit.deleteFile(singleLecture.video.public_id);
    }


    await course.deleteOne();
    res.status(200).json({
        success: true,
        message: "Course deleted successfully"
    });
});

export const deleteLecture = catchAsyncError(async(req, res, next) => {

    const { courseId, lectureId } = req.query;

    const course = await Course.findById(courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    const imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
    const lecture = course.lectures.find((item) => {
        if (item._id.toString() === lectureId.toString()) return item;
    });
    // await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    //     resource_type: "video",
    // });
    await imagekit.deleteFile(lecture.video.public_id);

    course.lectures = course.lectures.filter((item) => {
        if (item._id.toString() !== lectureId.toString()) return item;
    });

    course.numOfVideos = course.lectures.length;

    await course.save();

    res.status(200).json({
        success: true,
        message: "Lecture Deleted Successfully",
    });
});

Course.watch().on("change", async() => {
    const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

    const courses = await Course.find({});

    let totalViews = 0;
    for (let i = 0; i < courses.length; i++) {
        totalViews += courses[i].views;
    }
    stats[0].views = totalViews;
    stats[0].createdAt = new Date(Date.now());

    await stats[0].save();

});
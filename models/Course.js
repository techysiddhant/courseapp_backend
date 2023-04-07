import mongoose from "mongoose";

const schema = new mongoose.Schema({

    title: {
        type: String,
        required: [true, "Please Enter Course Title!"],
        minLength: [5, "Course Title must be longer than 5 characters!"],
        maxLength: [80, "Course Title must be shorter than 80 characters!"],
    },
    description: {
        type: String,
        required: [true, "Please Enter Course Description!"],
        minLength: [20, "Course Description must be longer than 20 characters!"],
    },
    lectures: [{
        title: {
            type: String,
            required: [true, "Please Enter Lecture Title!"],
        },
        description: {
            type: String,
            required: [true, "Please Enter Lecture Description!"],
        },
        video: {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    }],
    poster: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    views: {
        type: Number,
        default: 0
    },
    numOfVideos: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        required: [true, "Please Enter Course Category!"],
    },
    createdBy: {
        type: String,
        required: [true, "Please Enter Course Creator Name!"],
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});


export const Course = mongoose.model("Course", schema);
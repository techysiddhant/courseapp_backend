import express from 'express';
import { config } from 'dotenv';
import course from './routes/courseRoute.js';
import user from './routes/userRoutes.js';
import payment from './routes/paymentRoutes.js';
import ErrorMiddleware from './middlewares/Error.js';
import cookieParser from 'cookie-parser';
import other from './routes/otherRoutes.js';
import cors from "cors";
config({
    path: "./config/config.env"
})
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],

}));

app.use(function(req, res, next) {
    // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use("/api/v1", course);
app.use("/api/v1", user);
app.use("/api/v1", payment);
app.use("/api/v1", other);





export default app;
app.get('/', (req, res) => {
    res.send(`<h1>Server is Working. click <a href=${process.env.FRONTEND_URL}>here</a> to Visit frontend </h1>`)
})
app.use(ErrorMiddleware);
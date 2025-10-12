export const port = process.env.PORT || 3000

export const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5000",
];

export const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS not allowed for this origin"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Authorization", "Content-Length"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

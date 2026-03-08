import winston from "winston";

const { combine, timestamp, printf } = winston.format;

const logFormat = printf(({ level, message, timestamp, controller }) => {
    return `[${timestamp}] [${controller}] [${level.toUpperCase()}] - ${message}`;
});

const logger = winston.createLogger({
    level: "info",
    format: combine(
        timestamp(),
        winston.format.splat(),
        logFormat
    ),
    transports: [
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
        new winston.transports.File({ filename: "logs/combined.log" })
    ]
});

export class AppLogger {
    private controllerFunction: string;

    constructor(controllerFunction: string) {
        this.controllerFunction = controllerFunction;
    }

    info(message: string, objects?: Record<string, any>) {
        logger.info(message + "| Object passed: " + JSON.stringify(objects), { controller: this.controllerFunction });
    }

    error(error: Error, objects?: Record<string, any>) {
        logger.error(error?.message + "| Object passed: " + JSON.stringify(objects), { controller: this.controllerFunction });
    }
}
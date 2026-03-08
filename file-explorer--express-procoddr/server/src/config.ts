import env from "dotenv"

env.config({ path: "./.env" });

export const config = {
    port: process.env.PORT || 5000,
}
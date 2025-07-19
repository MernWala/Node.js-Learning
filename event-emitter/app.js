// import EventEmitter from "events"
import EventEmitter from "./custom-event-emitter.js"

const emitter = new EventEmitter()

emitter.on('abc', () => {
    console.log("ABC Event fired - 1");
});

emitter.on('abc', () => {
    console.log("ABC Event fired - 2");
});

emitter.on('x', () => {
    console.log("X Event fired");
});

// This event will fired only once and will be removed from emitter._event property
emitter.once("oneTime", () => {
    console.log("Once event fired");
});


// Via this function we can set max-listners. Like we've abc named event of 2 time and below we also set restriction for 2 then we can't create more than 2 event, If happens then we got a warning - Data Leakage
// emitter.setMaxListeners(2);


emitter.emit("abc");
emitter.emit("abc");

emitter.emit("oneTime");
emitter.emit("oneTime");
emitter.emit("oneTime");
emitter.emit("oneTime");
emitter.emit("oneTime");

class EventEmitter {
    constructor() {
        this._event = {}
    }

    on(eventName, handler) {
        if (this._event[eventName]) {
            if (Array.isArray(this._event[eventName])) {
                this._event[eventName] = [...this._event[eventName], handler]
            } else {
                this._event[eventName] = [this._event[eventName], handler]
            }
        } else {
            this._event[eventName] = handler
        }
    }

    emit(eventName) {
        if (this._event[eventName]) {
            const target = this._event[eventName]
            if (Array.isArray(target)) {
                target.forEach((event) => {
                    event()
                })
            } else {
                if (this._event[eventName]?.once === true) {
                    const entries = Object.entries(this._event)
                    this._event[eventName].handler();

                    this._event = {}
                    entries.forEach(([key, val]) => {
                        if (key !== eventName) {
                            this._event[key] = val
                        }
                    });
                } else {
                    target()
                }
            }
        }
    }

    once(eventName, handler) {
        this._event[eventName] = {
            once: true,
            handler,
        }
    }
}

export default EventEmitter
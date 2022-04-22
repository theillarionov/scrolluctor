(() => {
    "use strict";
    var __webpack_require__ = {};
    (() => {
        __webpack_require__.d = (exports, definition) => {
            for (var key in definition) {
                if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
                    Object.defineProperty(exports, key, {
                        enumerable: true,
                        get: definition[key]
                    });
                }
            }
        };
    })();
    (() => {
        __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
    })();
    var __webpack_exports__ = {};
    __webpack_require__.d(__webpack_exports__, {
        o: () => Scrolluctor
    });
    class Base {
        constructor(id) {
            this.id = id;
        }
    }
    class Driver extends Base {
        constructor({id}) {
            super(id);
            this.value = 0;
            this.adapters = new Set;
            Scrolluctor.instances.set(id, new Proxy(this, {
                set: function(target, key, value) {
                    target["value"] = value;
                    for (let adapter of target.adapters) {
                        adapter.value = target.value * 30;
                    }
                    return true;
                }
            }));
        }
        static init(drivers) {
            if (typeof drivers !== "undefined") {
                for (let i = 0, l = drivers.length; i < drivers.length; i++) {
                    const driver = drivers[i];
                    new this({
                        id: driver.id
                    });
                }
            }
        }
    }
    class Adapter extends Base {
        constructor({id, driver}) {
            super(id);
            this.value = 0;
            const proxy = new Proxy(this, {
                set: function(target, key, value) {
                    console.log("change");
                    target["value"] = value;
                    for (let element of target.elements) {
                        element.value = target.value * 30;
                    }
                    return true;
                }
            });
            Scrolluctor.instances.set(id, proxy);
            this.elements = new Set;
            this.driver = driver;
            this.driver.adapters.add(proxy);
        }
        static init(adapters) {
            if (typeof adapters !== "undefined") {
                for (let i = 0, l = adapters.length; i < adapters.length; i++) {
                    const adapter = adapters[i];
                    new this({
                        id: adapter.id,
                        driver: Scrolluctor.instances.get(adapter.driver)
                    });
                }
            }
        }
    }
    class Element extends Base {
        constructor({id, adapters}) {
            super(id);
            this.value = 0;
            Scrolluctor.instances.set(id, this);
            this.adapters = adapters;
            for (let adapter of this.adapters) {
                adapter.elements.add(this);
            }
        }
        static init(elements) {
            if (typeof elements !== "undefined") {
                for (let i = 0, l = elements.length; i < elements.length; i++) {
                    const element = elements[i];
                    const adapters = new Set;
                    element.adapters.forEach((adapterKey => {
                        adapters.add(Scrolluctor.instances.get(adapterKey));
                    }));
                    new this({
                        id: element.id,
                        adapters
                    });
                }
            }
        }
    }
    const Scrolluctor = {
        Driver,
        Adapter,
        Element,
        instances: new Map,
        init(options) {
            Driver.init(options === null || options === void 0 ? void 0 : options.drivers);
            Adapter.init(options === null || options === void 0 ? void 0 : options.adapters);
            Element.init(options === null || options === void 0 ? void 0 : options.elements);
            console.log(this.instances);
        }
    };
    window.Scrolluctor = Scrolluctor;
})();
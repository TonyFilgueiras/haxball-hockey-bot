import '@abraham/reflection';

export abstract class Module {
    constructor() {
        Reflect.defineMetadata('module:isModule', true, this);
    }
}

export default Module;
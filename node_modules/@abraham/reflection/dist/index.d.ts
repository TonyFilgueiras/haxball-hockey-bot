export declare type Decorator = ClassDecorator | MemberDecorator;
export declare type MemberDecorator = <T>(target: Target, propertyKey: PropertyKey, descriptor?: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;
export declare type MetadataKey = string | symbol;
export declare type PropertyKey = string | symbol;
export declare type Target = object | Function;
export declare function decorate(decorators: ClassDecorator[], target: Function): Function;
export declare function decorate(decorators: MemberDecorator[], target: object, propertyKey?: PropertyKey, attributes?: PropertyDescriptor): PropertyDescriptor | undefined;
export declare function metadata<MetadataValue>(metadataKey: MetadataKey, metadataValue: MetadataValue): (target: Target, propertyKey?: PropertyKey | undefined) => void;
export declare function getMetadata<MetadataValue>(metadataKey: MetadataKey, target: Target, propertyKey?: PropertyKey): MetadataValue | undefined;
export declare function getOwnMetadata<MetadataValue>(metadataKey: MetadataKey, target: Target, propertyKey?: PropertyKey): MetadataValue | undefined;
export declare function hasOwnMetadata(metadataKey: MetadataKey, target: Target, propertyKey?: PropertyKey): boolean;
export declare function hasMetadata(metadataKey: MetadataKey, target: Target, propertyKey?: PropertyKey): boolean;
export declare function defineMetadata<MetadataValue>(metadataKey: MetadataKey, metadataValue: MetadataValue, target: Target, propertyKey?: PropertyKey): void;
export declare const Reflection: {
    decorate: typeof decorate;
    defineMetadata: typeof defineMetadata;
    getMetadata: typeof getMetadata;
    getOwnMetadata: typeof getOwnMetadata;
    hasMetadata: typeof hasMetadata;
    hasOwnMetadata: typeof hasOwnMetadata;
    metadata: typeof metadata;
};
declare global {
    namespace Reflect {
        let decorate: typeof Reflection.decorate;
        let defineMetadata: typeof Reflection.defineMetadata;
        let getMetadata: typeof Reflection.getMetadata;
        let getOwnMetadata: typeof Reflection.getOwnMetadata;
        let hasOwnMetadata: typeof Reflection.hasOwnMetadata;
        let hasMetadata: typeof Reflection.hasMetadata;
        let metadata: typeof Reflection.metadata;
    }
}

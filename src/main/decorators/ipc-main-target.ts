export function ipcMainTarget() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    target = target.constructor;

    target.ipcMainBindings = target.ipcMainBindings || [];
    target.ipcMainBindings.push(propertyKey);
  };
}
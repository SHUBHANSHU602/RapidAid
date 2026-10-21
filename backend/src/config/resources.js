const resources = new Set();
// Importing routes must not create connections or start consumers.
function lazyResource(create) {
  let instance;
  return new Proxy({}, { get(_target, key) {
    if (!instance) { instance = create(); resources.add(instance); }
    const value = instance[key];
    return typeof value === 'function' ? value.bind(instance) : value;
  } });
}
async function closeResources() {
  await Promise.all([...resources].map(resource => resource.close()));
  resources.clear();
}
module.exports = { lazyResource, closeResources, resourceCount: () => resources.size };

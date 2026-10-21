const { TestEnvironment } = require('jest-environment-node');
module.exports = class extends TestEnvironment {
  async teardown() {
    try { if (this.global.closeTestResources) await this.global.closeTestResources(); }
    finally { await super.teardown(); }
  }
};

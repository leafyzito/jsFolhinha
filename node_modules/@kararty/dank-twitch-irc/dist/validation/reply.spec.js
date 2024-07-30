"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_spec_1 = require("../helpers.spec");
const reply_1 = require("./reply");
const validation_error_1 = require("./validation-error");
describe("./validation/reply", function () {
    describe("#validateMessageID()", function () {
        it("rejects undefined", function () {
            (0, helpers_spec_1.assertThrowsChain)(() => (0, reply_1.validateMessageID)(undefined), validation_error_1.ValidationError, "Message ID undefined is invalid/malformed");
        });
        it("rejects null", function () {
            (0, helpers_spec_1.assertThrowsChain)(() => (0, reply_1.validateMessageID)(null), validation_error_1.ValidationError, "Message ID null is invalid/malformed");
        });
        it("rejects empty strings", function () {
            (0, helpers_spec_1.assertThrowsChain)(() => (0, reply_1.validateMessageID)(""), validation_error_1.ValidationError, "Message ID empty string is invalid/malformed");
        });
        it("allows dashes", function () {
            (0, reply_1.validateMessageID)("885196de-cb67-427a-baa8-82f9b0fcd05f");
            (0, reply_1.validateMessageID)("8dfe2f75-a6c6-445a-927d-bfe7ad023c9f");
        });
    });
});
//# sourceMappingURL=reply.spec.js.map
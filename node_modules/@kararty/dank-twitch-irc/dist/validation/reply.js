"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMessageID = void 0;
const reason_for_value_1 = require("../utils/reason-for-value");
const validation_error_1 = require("./validation-error");
const messageIDRegex = /^[\w-]+$/;
function validateMessageID(input) {
    if (input == null || !messageIDRegex.test(input)) {
        throw new validation_error_1.ValidationError(`Message ID ${(0, reason_for_value_1.reasonForValue)(input)} is invalid/malformed`);
    }
}
exports.validateMessageID = validateMessageID;
//# sourceMappingURL=reply.js.map
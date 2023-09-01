import { schema } from "app/models/OtherReason.schema";
import { SchemaValidator } from "app/utils/validation/SchemaValidator";
import { ValidationError } from "app/utils/validation/ValidationError";

import { assertValidationErrors } from "test/models/ValidationAssertions";

const validator = new SchemaValidator(schema);

const nameErrorMessage = "Enter your name";
const relationshipToCompanyErrorMessage = "Enter your relationship to the company";
const titleErrorMessage = "You must give your reason a title";
const descriptionErrorMessage = "You must give us more information";

describe("OtherReason schema", () => {
    it("should reject empty object", () => {
        const validationResult = validator.validate({});
        assertValidationErrors(validationResult, [
            new ValidationError("name", nameErrorMessage),
            new ValidationError("relationshipToCompany", relationshipToCompanyErrorMessage),
            new ValidationError("title", titleErrorMessage),
            new ValidationError("description", descriptionErrorMessage)
        ]);
    });

    it("should reject undefined values", () => {
        const validationResult = validator.validate({
            name: undefined,
            relationshipToCompany: undefined,
            title: undefined,
            description: undefined
        });
        assertValidationErrors(validationResult, [
            new ValidationError("name", nameErrorMessage),
            new ValidationError("relationshipToCompany", relationshipToCompanyErrorMessage),
            new ValidationError("title", titleErrorMessage),
            new ValidationError("description", descriptionErrorMessage)
        ]);
    });

    it("should reject null values", () => {
        const validationResult = validator.validate({
            name: null,
            relationshipToCompany: null,
            title: null,
            description: null
        });
        assertValidationErrors(validationResult, [
            new ValidationError("name", nameErrorMessage),
            new ValidationError("relationshipToCompany", relationshipToCompanyErrorMessage),
            new ValidationError("title", titleErrorMessage),
            new ValidationError("description", descriptionErrorMessage)
        ]);
    });

    it("should reject empty values", () => {
        const validationResult = validator.validate({
            name: "",
            relationshipToCompany: "",
            title: "",
            description: ""
        });
        assertValidationErrors(validationResult, [
            new ValidationError("name", nameErrorMessage),
            new ValidationError("relationshipToCompany", relationshipToCompanyErrorMessage),
            new ValidationError("title", titleErrorMessage),
            new ValidationError("description", descriptionErrorMessage)
        ]);
    });

    it("should reject blank values", () => {
        const validationResult = validator.validate({
            name: " ",
            relationshipToCompany: " ",
            title: " ",
            description: " "
        });
        assertValidationErrors(validationResult, [
            new ValidationError("name", nameErrorMessage),
            new ValidationError("relationshipToCompany", relationshipToCompanyErrorMessage),
            new ValidationError("title", titleErrorMessage),
            new ValidationError("description", descriptionErrorMessage)
        ]);
    });

    it("should allow non empty values", () => {
        const validationResult = validator.validate({
            name: "Some name",
            relationshipToCompany: "Some relationship",
            title: "Some reason",
            description: "Some description"
        });
        assertValidationErrors(validationResult, []);
    });

    it("should allow non empty values with leading / trailing spaces", () => {
        const validationResult = validator.validate({
            name: " Some name ",
            title: " Some reason ",
            relationshipToCompany: " Some relationship ",
            description: " Some description "
        });
        assertValidationErrors(validationResult, []);
    });
});

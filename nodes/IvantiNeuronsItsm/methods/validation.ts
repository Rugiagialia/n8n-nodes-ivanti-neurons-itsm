import {
    NodeOperationError,
    validateFieldType,
    getValueDescription,
    IDataObject,
} from 'n8n-workflow';
import type { INode, FieldType } from 'n8n-workflow';

export interface AssignmentEntry {
    name: string;
    value: unknown;
    type?: FieldType;
}

export const validateEntry = (
    name: string,
    type: FieldType,
    value: unknown,
    node: INode,
    itemIndex: number,
    ignoreErrors = false,
): { name: string; value: unknown } => {
    // Handle null/undefined values
    if (value === undefined || value === null) {
        if (ignoreErrors) {
            return { name, value: null };
        }
        // For null/undefined, we'll pass through unless strict validation is needed
        return { name, value: null };
    }

    const description = `To fix the error try to change the type for the field "${name}" or activate the option "Ignore Type Conversion Errors" to apply a less strict type validation`;

    // String conversion
    if (type === 'string') {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        } else {
            value = String(value);
        }
    }

    // Use n8n's built-in field type validation
    const validationResult = validateFieldType(name, value, type);

    if (!validationResult.valid) {
        if (ignoreErrors) {
            return { name, value: value ?? null };
        } else {
            const message = `${'errorMessage' in validationResult ? validationResult.errorMessage : `'${name}' expects a ${type} but we got ${getValueDescription(value)}`} [item ${itemIndex}]`;
            throw new NodeOperationError(node, message, {
                itemIndex,
                description,
            });
        }
    }

    return {
        name,
        value: validationResult.newValue ?? null,
    };
};

export const processAssignments = (
    assignments: Array<{ name: string; value: unknown; type?: string }>,
    node: INode,
    itemIndex: number,
    ignoreConversionErrors: boolean = false,
): IDataObject => {
    const result: IDataObject = {};

    for (const assignment of assignments) {
        const { name, type } = assignment;
        let { value } = assignment;

        // If no type specified, just pass the value through (cast to any to satisfy IDataObject)
        if (!type) {
            result[name] = value as any;
            continue;
        }

        // Validate and convert the value based on type
        const validated = validateEntry(
            name,
            type as FieldType,
            value,
            node,
            itemIndex,
            ignoreConversionErrors,
        );

        result[validated.name] = validated.value as any;
    }

    return result;
};

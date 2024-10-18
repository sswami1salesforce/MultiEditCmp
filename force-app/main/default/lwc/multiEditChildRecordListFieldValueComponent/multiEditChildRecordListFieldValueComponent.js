import { LightningElement, api } from 'lwc';

export default class MultiEditChildRecordListFieldValueComponent extends LightningElement {
    @api record;
    @api field;

    get formattedFieldValue() {
        const fieldNameWithoutObject = this.field.split('.')[1]; // Remove object prefix
        return this.record.fields[fieldNameWithoutObject] ? this.record.fields[fieldNameWithoutObject] : '';
    }
}
import { LightningElement, wire, api } from 'lwc';
import getPicklistFields from '@salesforce/apex/MultiEditCmpController.getPicklistFields';
import {getRecord} from 'lightning/uiRecordApi';

export default class MultiEdit extends LightningElement {
    error;
    records;
    @api recordId;
    @api relatedListObject;
    @api relatedListLabel;
    @api fieldsString; // Accept comma-separated fields as a string
    @api relatedObjectApiName;
    @api parentField;
    @api relatedListUniqueName;
    @api isCustomConditionsMode;
    @api customConditionsApexClass;
    @api isCustomFiltersMode;
    @api customFiltersApexClass;
    @api isCustomSaveMode;
    @api customSaveApexClass;
    @api objectApiName;

    refreshParentRecord = false;
    hasRecordUpdated = false;

    get reactiveRecordId() {
        return this.recordId;
    }
    
    picklistFields = {};
    defaultRecordTypeId = '';

    get fieldsArray() {
        const fieldsWithoutApiName = this.fieldsString ? this.fieldsString.split(',').map(field => field.trim()) : [];
        const fieldsWithApiName = fieldsWithoutApiName.map(field => `${this.relatedObjectApiName}.${field}`);
        return fieldsWithApiName;
    }
    
    @wire(getPicklistFields, { sObjectName: '$relatedObjectApiName', fieldsString: '$fieldsString' })
    wiredPicklistFields({ error, data }) {
        if (data) {
            this.picklistFields = data.picklistFields; // This will contain the API names of picklist fields
            this.defaultRecordTypeId = data.defaultRecordTypeId;
        } else if (error) {
            console.error('Error fetching picklist fields:', error);
        }
    }

    @wire(getRecord, { recordId: '$reactiveRecordId', fields: [`$objectApiName.Id`] })
    wiredRecord(result) {
        this.record = result;
        if (result.data && !this.hasRecordUpdated) {
            this.refreshParentRecord = true;
            this.hasRecordUpdated = true;
        } else if (result.error) {
            console.error('Error fetching the record:', result.error);
        }
    }

    handleChildRefreshCompleted() {
        this.refreshParentRecord = false; // Reset flag after the child completes the refresh
        this.hasRecordUpdated = false; // Reset the update tracking
    }
}
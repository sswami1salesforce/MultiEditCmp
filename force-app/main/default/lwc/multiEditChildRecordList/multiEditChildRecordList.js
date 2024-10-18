import { LightningElement, api, wire } from 'lwc';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';
import getParentRecord from '@salesforce/apex/MultiEditCmpController.getParentRecord';
import getFieldConditions from '@salesforce/apex/MultiEditCmpController.getFieldConditions';
import MyModal from 'c/multiEditModal';

//TO DO:
//* Allow apex class implementation for filtering logic - it first returns a list of filters to be slected from then a filter implementation is where it accepts a list of records applies filters and returns back the same list with filters applied
//* FieldsToDisplay and fields used in fieldConditions can be different so make sure fields used in the fieldconditions are also in the extrcatedFields with a flag to indicate if it is a condition only field
//* Allow apex class implememntation for field conditions logic - We have these conditions Edit, delete, Save, Hidden, ReadOnly and Mandatory. If we choose apex we will only be able to apply conditions with server trips, so provide a verify and save button in UI.

export default class MultiEditChildRecordList extends LightningElement {
    error;
    records;
    @api parentRecordId;
    @api relatedListId;
    @api fieldsString; // Accept comma-separated fields as a string
    @api fieldsToDisplay;
    @api relatedObjectApiName;
    @api relatedListLabel;
    @api parentField;
    @api relatedListObject;
    @api relatedListUniqueName;
    @api picklistFields = {};
    @api defaultRecordTypeId = '';
    @api refreshParentRecord;
    @api isCustomConditionsMode;
    @api customConditionsApexClass;
    @api isCustomFiltersMode;
    @api customFiltersApexClass;
    @api isCustomSaveMode;
    @api customSaveApexClass;

    fieldConditions = [];
    hasRecords = false;
    parentRecord = {};
    parentLoaded = false;

    @wire(getRelatedListRecords, {
        parentRecordId: '$parentRecordId',
        relatedListId: '$relatedListId',
        fields: '$fieldsToDisplay',
    })
    listInfo({ error, data }) {
        if (data) {
            this.records = data.records.map((record) => ({
                ...record,
                fields: Object.fromEntries(
                    Object.entries(record.fields).map(([field, value]) => [field, value.value])
                ),
            }));
            if (this.records.length > 0) { this.hasRecords = true; }
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.records = undefined;
        }
    }

    @wire(getFieldConditions, { objectApiName: '$relatedObjectApiName', relatedListUniqueName: '$relatedListUniqueName' })
    wiredFieldConditions({ error, data }) {
        if (data) {
            this.fieldConditions = data;

            // Extract parent fields from conditions
            const parentFieldsToQuery = this.getParentFieldsFromConditions(this.fieldConditions);

            // Check if there are any parent fields to query
            if (parentFieldsToQuery && parentFieldsToQuery.length > 0) {
                // Now use parentFieldsToQuery to query only these fields on the parent record 
                this.refreshParentRecordMethod(parentFieldsToQuery);
            } else {
                console.log('No parent fields to query.');
                this.parentLoaded = true;
            }
        } else if (error) {
            console.error('Error fetching field conditions:', error);
            this.parentLoaded = true;
        }
    }

    renderedCallback() {
        if (this.refreshParentRecord) {
            this.handleRefreshRecord();
        }
    }

    handleRefreshRecord() {
        if(this.fieldConditions.length === 0){return;}
        const parentFieldsToQuery = this.getParentFieldsFromConditions(this.fieldConditions);
        if (parentFieldsToQuery && parentFieldsToQuery.length > 0) {
            this.refreshParentRecordMethod(parentFieldsToQuery); // Refresh parent record
            this.dispatchEvent(new CustomEvent('childrefreshcompleted'));
        }
    }

    getParentFieldsFromConditions(conditions) {
        const parentFields = new Set(); // Using Set to avoid duplicates

        conditions.forEach(condition => {
            const conditionsToCheck = [condition.hiddenCondition, condition.readonlyCondition, condition.mandatoryCondition];

            conditionsToCheck.forEach(cond => {
                if (cond) {
                    // Use regex to find all occurrences of [parent__<fieldName>]
                    const matches = cond.match(/\[parent__([a-zA-Z0-9_]+)\]/g);
                    if (matches) {
                        matches.forEach(match => {
                            // Extract just the field name (e.g., parent__Name -> Name)
                            const fieldName = match.replace('[parent__', '').replace(']', '');
                            parentFields.add(fieldName);
                        });
                    }
                }
            });
        });

        // Return the array of unique parent field names
        return Array.from(parentFields); // Convert Set to Array and return it
    }

    // Call Apex to get the updated parent record
    refreshParentRecordMethod(parentFieldsToQuery) {
        getParentRecord({ parentRecordId: this.parentRecordId, fields: parentFieldsToQuery })
            .then(data => {
                this.parentRecord = data;
                this.parentLoaded = true;
            })
            .catch(error => {
                console.error('Error querying parent record:', error);
                this.parentLoaded = true;
            });
    }



    get formattedFieldValue() {
        return this.fieldsToDisplay.map((field) => {
            return this.records.map((rec) => {
                const fieldValue = rec.fields[field] ? rec.fields[field].value : '';
                return fieldValue;
            });
        });
    }

    get computeGridClass() {
        const numberOfFields = this.fieldsToDisplay.length;
        const gridClass = `slds-col slds-align_absolute-center slds-size_1-of-${numberOfFields + 1}`;
        return gridClass;
    }

    get computeGridClass2() {
        const numberOfFields = this.fieldsToDisplay.length;
        const gridClass = `slds-col slds-align_absolute-center slds-m-top_large slds-size_1-of-${numberOfFields + 1}`;
        return gridClass;
    }

    get fieldNames() {
        return this.fieldsToDisplay.map(field => {
            // Split the field name by dot and return the last part
            return field.split('.').pop();
        });
    }

    get extractedFields() {
        return this.fieldsToDisplay.map(fieldString => {
            const parts = fieldString.split('.');
            if (parts.length === 2) {
                const isParentField = parts[1] === this.parentField;
                const isPicklist = this.picklistFields && Object.prototype.hasOwnProperty.call(this.picklistFields, parts[1]);
                const picklistApi = {
                    fieldApiName: parts[1],
                    objectApiName: this.relatedObjectApiName
                };
                return { name: parts[1], isParentField: isParentField, isPicklist: isPicklist, picklistApi: picklistApi};
            } else {
                console.error(`Invalid input format: ${fieldString}. Expected "Object.Field"`);
                return null;
            }
        }).filter(Boolean); // Remove null values from the resulting array
    }
            

    async handleEditRecord(event) {
        const records = this.records;
        // Implement your edit logic here
        const result = await MyModal.open({
            size: 'large',
            description: 'Accessible description of modal\'s purpose',
            content: 'Passed into content api',
            records,  // Use the variable directly, not as a string
            computeGridClass: this.computeGridClass,
            computeGridClass2: this.computeGridClass2,
            extractedFields: this.extractedFields,
            fieldNames: this.fieldNames,
            relatedListId: this.relatedListId,
            parentField: this.parentField,
            parentRecordId: this.parentRecordId,
            relatedObjectApiName: this.relatedObjectApiName,
            relatedListUniqueName: this.relatedListUniqueName,
            parentRecord: this.parentRecord,
            fieldConditions: this.fieldConditions,
            defaultRecordTypeId: this.defaultRecordTypeId,
            isCustomConditionsMode: this.isCustomConditionsMode,
            customConditionsApexClass: this.customConditionsApexClass,
            isCustomFiltersMode: this.isCustomFiltersMode,
            customFiltersApexClass: this.customFiltersApexClass,
            isCustomSaveMode: this.isCustomSaveMode,
            customSaveApexClass: this.customSaveApexClass,
            onrecordsupdated: (e) => {
                // stop further propagation of the event
                e.stopPropagation();
                // hand off to separate function to process
                this.handleRecordsUpdated(e.detail);
            }
        });
    }
    handleRecordsUpdated(event) {
        const { updatedRecords } = event;
        // Update the records with the new data
        this.records = updatedRecords;
    }
}
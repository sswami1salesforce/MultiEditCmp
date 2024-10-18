import { api, wire, track } from 'lwc';
import LightningModal from 'lightning/modal';
import Toast from 'lightning/toast';
import { refreshApex, deleteRecord } from 'lightning/uiRecordApi';
import getFieldConditions from '@salesforce/apex/MultiEditCmpController.getFieldConditions';
import getCustomFieldConditions from '@salesforce/apex/MultiEditCmpController.getCustomFieldConditions';
import getAvailableFilters from '@salesforce/apex/MultiEditCmpController.getAvailableFilters';
import applyCustomFilter from '@salesforce/apex/MultiEditCmpController.applyCustomFilter';
import handleCustomSave from '@salesforce/apex/MultiEditCmpController.handleCustomSave';

export default class multiEditModal extends LightningModal {
    @api content;
    @api records;
    @api computeGridClass;
    @api computeGridClass2;
    @api extractedFields;
    @api fieldNames;
    @api relatedListId;
    @api relatedObjectApiName;
    @api parentField;
    @api parentRecordId;
    @api relatedListUniqueName;
    @api parentRecord;
    @api defaultRecordTypeId;
    @api isCustomConditionsMode;
    @api customConditionsApexClass;
    @api isCustomFiltersMode;
    @api customFiltersApexClass;
    @api isCustomSaveMode;
    @api customSaveApexClass;

    selectedValue = '';
    isFieldVisible = true;
    isLoading = true;
    fieldConditions;
    hiddenConditions = {};
    readonlyConditions = {};
    mandatoryConditions = {};
    // Maintain verification status for each record
    verificationStatus = {};


    @track filteredRecords = [];
    @track filterCriteria = {};
    @track filters = [];
    @track selectedFilter = '';
    @track isCustomFilterMode = false;

    // Handle change between simple and custom filters
    toggleFilterMode() {
        if (this.isCustomFiltersMode) {
            this.isCustomFilterMode = !this.isCustomFilterMode;
        }
    }

    applyFilters() {
        if (Object.keys(this.filterCriteria).length === 0) {
            // If no filter criteria is set, show all records
            this.records = this.records.map(record => ({
                ...record,
                filteredOut: false // Show all records
            }));
            return;
        }

        // Apply filtering logic based on the filterCriteria object
        this.records = this.records.map(record => {
            const matchesCriteria = Object.keys(this.filterCriteria).every(field => {
                const searchValue = this.filterCriteria[field].toLowerCase();
                const recordValue = (record.fields[field] || '').toLowerCase();
                return recordValue.includes(searchValue); // Case-insensitive match
            });

            return {
                ...record,
                filteredOut: !matchesCriteria // Set filteredOut flag for unmatched records
            };
        });
    }


    // This method can be called when a user types in a search input to filter
    handleFilterChange(event) {
        const fieldSearchTerm = event.target.value;
        const fieldSearchName = event.target.dataset.filterfieldname;
        // Add/Update the field and its value to filter criteria
        if (fieldSearchTerm) {
            this.filterCriteria[fieldSearchName] = fieldSearchTerm;
        } else {
            // If value is empty, remove the field from filter criteria
            delete this.filterCriteria[fieldSearchName];
        }
    }

    clearFilters() {
        // Clear the filter criteria
        this.filterCriteria = [];

        // Reset the filteredOut flag for all records
        this.records = this.records.map(record => ({
            ...record,
            filteredOut: false // show all records
        }));

        const filterInputs = this.template.querySelectorAll('lightning-input-field[data-filterfieldname]');
        filterInputs.forEach(input => {
            input.value = ''; // Clear the filter field inputs
        });

        const customFilter = this.template.querySelectorAll('lightning-combobox[data-filterfieldname]');
        customFilter.forEach(input => {
            input.value = ''; // Clear the filter field inputs
        });

        // this.applyFieldConditions();
    }

    fetchAvailableFilters() {
        getAvailableFilters({ apexClassName: this.customFiltersApexClass })
            .then(result => {
                console.log('tst257' + JSON.stringify(result));
                this.filters = result.map(filterName => ({ label: filterName, value: filterName }));
            })
            .catch(error => {
                console.error('Error fetching filters', error);
            });
    }

    applySelectedFilter() {
        const recordIds = this.records.map(record => record.id); // Collect all record IDs
        console.log('tst257' + JSON.stringify(recordIds));
        console.log('tst257' + JSON.stringify(this.selectedFilter));
        applyCustomFilter({
            apexClassName: this.customFiltersApexClass,
            filterName: this.selectedFilter,
            recordIds: recordIds
        })
            .then(filteredIds => {
                console.log('tst257' + JSON.stringify(filteredIds));
                // Update the filteredOut flag based on the IDs returned from Apex
                this.records = this.records.map(record => ({
                    ...record,
                    filteredOut: !filteredIds.includes(record.id) // Hide records not in the filtered list
                }));
            })
            .catch(error => {
                console.error('Error applying custom filter:', error);
            });
    }

    handleCustomFilterChange(event) {
        this.selectedFilter = event.detail.value; // Store the selected filter
    }

    @wire(getFieldConditions, { objectApiName: '$relatedObjectApiName', relatedListUniqueName: '$relatedListUniqueName', })
    wiredFieldConditions({ error, data }) {
        if (data) {
            this.fieldConditions = data;
            this.applyFieldConditions();
        } else if (error) {
            console.error(error);
        }
    }

    connectedCallback() {
        if (this.isCustomFiltersMode) {
            this.fetchAvailableFilters();
        }
        console.log('tst257' + JSON.stringify(this.records));
        this.addTempIds();
        if (!this.records || this.records.length === 0) { this.isLoading = false; }
        // this.filteredRecords = [...this.records];
    }
    //Needtofix
    addTempIds() {
        this.records = this.records.map(record => ({
            ...record,
            tempid: record.id || `temp_${Date.now()}` // Use existing ID or assign a new temp ID
        }));
    }

    handleOkay() {
        this.close('okay');
    }
    //Needtofix
    addNewRecord() {
        // Create a new record object with a unique ID
        const newRecord = {
            tempid: `temp_${Date.now()}` // Initialize fields if necessary
        };
        // Add the new record to the records array
        this.records = [...this.records, newRecord];
        setTimeout(() => {
            this.scrollToLastRecord();
        }, 500);
        // this.applyFieldConditions(); 
    }

    scrollToLastRecord() {
        const recordContainers = this.template.querySelectorAll('.record-container');
        const lastRecordContainer = recordContainers[recordContainers.length - 1];
        lastRecordContainer.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }

    handleLoad(event) {
        this.isLoading = true;
        window.console.time("LDS call");
        //details coming on the load of form
        // The LDS will take a few seconds to load the component.
        const recUi = event.detail;
        window.console.timeEnd("LDS call");
        this.applyFieldConditions();
        if (this.isCustomConditionsMode) {
            this.verifyCustomConditions();
        }
        this.isLoading = false;
    }
    //Needtofix
    startLoad(event) {
        this.isLoading = true;
        event.preventDefault(); // Prevent the default form submission
        const recordId = event.target.dataset.tempId;
        const record = this.records.find(rec => rec.tempid === recordId);
        const fields = event.detail.fields;

        // Validate all custom picklist fields
        const picklistFields = [...this.template.querySelectorAll(`c-custom-picklist-search[data-tempid="${recordId}"]`)];
        let allPicklistsValid = picklistFields.reduce((validSoFar, picklistCmp) => {
            return validSoFar && picklistCmp.reportValidity();
        }, true);

        if (record && allPicklistsValid) {
            if (recordId.startsWith('temp_')) {
                record.fields[this.parentField] = this.parentRecordId;
            }
            // Get the form data and inject the picklist value
            const fields = record.fields;
            if (this.isCustomSaveMode) {
                const recordData = {
                    objectApiName: this.relatedObjectApiName,  // Dynamically pass object API name
                    recordId: recordId,        // Pass record ID, if it exists (for update)
                    fields: fields
                };
                // If custom save is enabled, call Apex to handle the custom save logic
                handleCustomSave({ recordData: recordData, apexClassName: this.customSaveApexClass })
                    .then((response) => {
                        if (response.success) {
                            this.onSave({ detail: { id: response.recordId, fields } });
                        } else {
                            this.onError({ detail: { message: response.message } });
                        }
                    })
                    .catch((error) => {
                        console.error('Custom save error:', error);
                        this.onError(error);
                    });
            } else {
                // Submit the form programmatically with the updated fields
                this.template.querySelector(`lightning-record-edit-form[data-temp-id="${recordId}"]`).submit(fields);
            }
        } else {
            console.error('Form submission blocked due to invalid fields');
            this.isLoading = false;
        }
    }

    //Needtofix
    onSave(event) {
        this.isLoading = false;
        const savedRecord = this.transformDetailToRecord(event.detail);

        // Check if the record already exists in the records array
        const existingRecordIndex = this.records.findIndex(record => record.id === savedRecord.id);

        if (existingRecordIndex !== -1) {
            // Update the existing record in the records array
            this.records = [
                ...this.records.slice(0, existingRecordIndex),
                savedRecord,
                ...this.records.slice(existingRecordIndex + 1)
            ];
        } else {
            // Add the newly created record to the records array
            this.records = [...this.records, savedRecord];
        }

        this.records = this.records.filter(record => record.id);

        const recordId = event.detail.id;
        this.addTempIds();

        this.applyFieldConditions();

        Toast.show({
            label: '{0} has been created/updated',
            labelLinks: [{
                url: `/lightning/r/${this.relatedObjectApiName}/${recordId}/view`,
                label: 'Record'
            }],
            mode: 'sticky',
            variant: 'success',
        }, this);

        const updatedRecordsEvent = new CustomEvent('recordsupdated', {
            detail: { updatedRecords: this.records }
        });

        this.dispatchEvent(updatedRecordsEvent);

    }

    onError(event) {
        this.isLoading = false;
        Toast.show({
            label: 'Error saving record: ' + event.detail.message,
            variant: 'error'
        }, this);
    }

    //Needtofix
    handleDeleteRecord(event) {
        this.isLoading = true;
        const recordId = event.target.dataset.recordId;
        const tempId = event.target.dataset.tempid;
        if (recordId) {
            deleteRecord(recordId)
                .then(() => {
                    Toast.show({
                        label: 'Record has been deleted',
                        variant: 'success',
                    }, this);
                    this.records = this.records.filter(record => record.id !== recordId);
                    this.isLoading = false;
                    const updatedRecordsEvent = new CustomEvent('recordsupdated', {
                        detail: { updatedRecords: this.records }
                    });

                    this.dispatchEvent(updatedRecordsEvent);
                })
                .catch(error => {
                    Toast.show({
                        label: 'Error deleting record',
                        variant: 'error',
                        message: `Error deleting record: ${error.body.output.errors[0].message}`,
                    }, this);
                    this.isLoading = false;
                });
        } else if (tempId) {
            this.records = this.records.filter(record => record.tempid !== tempId);
            this.isLoading = false;
        }
    }

    handleFieldChange(event) {
        const fieldName = event.target.dataset.fieldname;
        const value = event.target.value;
        const recordId = event.target.dataset.tempid;

        // Update the records array with the changed field value for the corresponding record
        this.records = this.records.map(record => {
            if (record.tempid === recordId) {
                return {
                    ...record,
                    fields: {
                        ...record.fields,
                        [fieldName]: value,
                    },
                };
            }
            return record;
        });
        this.applyFieldConditions();
        if (this.isCustomConditionsMode) {
            this.verificationStatus[recordId] = false;
            this.updateSaveButtonState(recordId);
        }
    }

    mergeRecords(parentRecord, childRecords) {
        return childRecords.map((childRecord) => {
            const mergedFields = Object.assign({}, childRecord.fields);
            for (const key in parentRecord) {
                mergedFields[`parent__${key}`] = parentRecord[key];
            }
            return {
                ...childRecord,
                fields: mergedFields,
            };
        });
    }

    verifyCustomConditions(event) {
        let recordsToVerify = {};

        if (event) {
            // Individual record verification (button click)
            const recordId = event.target.dataset.tempid;

            // Find the specific record to verify
            const record = this.records.find(rec => rec.tempid === recordId);
            if (!record) {
                console.error("Record not found for verification.");
                return;
            }

            // Prepare only the selected record for verification
            recordsToVerify[record.tempid] = record.fields;
        } else {
            // Initial load verification (no event, verify all records)
            this.records.forEach(record => {
                recordsToVerify[record.tempid] = record.fields;
            });
        }

        // Call Apex to fetch custom conditions (either for one or all records)
        getCustomFieldConditions({ records: recordsToVerify, apexClassName: this.customConditionsApexClass })
            .then(result => {
                // Apply the custom conditions to all returned records (single or multiple)
                this.applyCustomFieldConditions(result.fieldConditions);
                // Update the New button state based on the returned condition
                this.updateNewButtonState(result.newRecordCondition);
                // Update verification status for each record that was verified
                result.fieldConditions.forEach(condition => {
                    const recordTempId = condition.recordId;

                    // Update the verification status to true for each record that has been verified
                    this.verificationStatus[recordTempId] = true;

                    // Update the Save button state for the verified record
                    this.updateSaveButtonState(recordTempId);
                });
            })
            .catch(error => {
                console.error('Error verifying custom conditions:', error);
            });
    }


    updateSaveButtonState(recordTempId) {
        // Find the Save button corresponding to this specific record
        const saveButton = this.template.querySelector(`lightning-button-icon[data-tempid="${recordTempId}"][data-btn="save"]`);

        if (saveButton) {
            // Check the verification status
            const isVerified = this.verificationStatus[recordTempId];

            // Toggle the 'slds-hide' class based on verification status
            saveButton.classList.toggle('slds-hide', !isVerified);
        }
    }

    updateNewButtonState(isConditionMet) {
        this.toggleButtonState('newRecordButton', 'lightning-button', isConditionMet); // For new button
    }   

    // Apply custom conditions received from Apex
    applyCustomFieldConditions(customConditions) {
        customConditions.forEach(condition => {
            const { recordId, fieldName, hidden, readonly, mandatory, deleteRecordCondition, saveRecordCondition } = condition;

            if (fieldName) {
                // Apply field-level conditions
                this.applyConditionResults(recordId, fieldName, { hidden, readonly, mandatory });
            }
            console.log('tst2577' + JSON.stringify(condition));
            // Apply delete button condition if present
            if (deleteRecordCondition !== undefined) {
                this.toggleButtonState(recordId, 'lightning-button-icon[data-btn="delete"]', deleteRecordCondition);
            }

            // Apply save button condition if present
            if (saveRecordCondition !== undefined) {
                this.toggleButtonState(recordId, 'lightning-button-icon[data-btn="save"]', saveRecordCondition);
            }
        });
    }


    applyFieldConditions() {
        if (!this.fieldConditions || this.fieldConditions.length === 0 || !this.records || this.records.length === 0 || this.isCustomConditionsMode) {
            return;
        }

        // Merge parentRecord with child records    
        const mergedRecords = this.mergeRecords(this.parentRecord, this.records);
        // Apply conditions to each field or record
        this.fieldConditions.forEach(condition => {
            const fieldName = condition.fieldName;

            if (fieldName) {
                this.applyFieldLevelConditions(condition, mergedRecords);
            } else {
                this.applyRecordLevelConditions(condition, mergedRecords);
            }
        });
    }

    applyFieldLevelConditions(condition, mergedRecords) {
        const fieldName = condition.fieldName;

        // Set up the conditions for hidden, readonly, and mandatory
        this.hiddenConditions[fieldName] = this.transformCondition(condition.hiddenCondition);
        this.readonlyConditions[fieldName] = this.transformCondition(condition.readonlyCondition);
        this.mandatoryConditions[fieldName] = this.transformCondition(condition.mandatoryCondition);

        // Apply these conditions to each record
        mergedRecords.forEach(record => {
            const recordId = record.tempid;
            const fieldConditions = {
                hidden: this.evaluateCondition(record.fields, this.hiddenConditions[fieldName]),
                readonly: this.evaluateCondition(record.fields, this.readonlyConditions[fieldName]),
                mandatory: this.evaluateCondition(record.fields, this.mandatoryConditions[fieldName]),
            };

            this.applyConditionResults(recordId, fieldName, fieldConditions);
        });
    }

    applyRecordLevelConditions(condition, mergedRecords) {
        // Handle new, delete and save conditions
        if (condition.deleteRecordCondition) {
            this.applyDeleteRecordCondition(condition, mergedRecords);
        }

        if (condition.editRecordCondition) {
            this.applySaveRecordCondition(condition, mergedRecords);
        }

        if (condition.newRecordCondition) {
            this.applyNewRecordCondition(condition, mergedRecords);
        }
    }

    applyDeleteRecordCondition(condition, mergedRecords) {
        const transformedCondition = this.transformCondition(condition.deleteRecordCondition);

        mergedRecords.forEach(record => {
            const isConditionMet = this.evaluateCondition(record.fields, transformedCondition);
            this.toggleButtonState(record.tempid, 'lightning-button-icon[data-btn="delete"]', isConditionMet); // For delete button
        });
    }

    applySaveRecordCondition(condition, mergedRecords) {
        const transformedCondition = this.transformCondition(condition.editRecordCondition);

        mergedRecords.forEach(record => {
            const isConditionMet = this.evaluateCondition(record.fields, transformedCondition);
            this.toggleButtonState(record.tempid, 'lightning-button-icon[data-btn="save"]', isConditionMet); // For save button
        });
    }

    applyNewRecordCondition(condition, mergedRecords) {
        const transformedCondition = this.transformCondition(condition.newRecordCondition);

        mergedRecords.forEach(record => {
            const isConditionMet = this.evaluateCondition(record.fields, transformedCondition);
            this.toggleButtonState('newRecordButton', 'lightning-button', isConditionMet); // For new button
        });
    }

    toggleButtonState(recordId, buttonType, disable) {
        const button = this.template.querySelector(`${buttonType}[data-tempid="${recordId}"]`);
        if (button) {
            button.disabled = disable;
        }
    }

    transformCondition(condition) {
        if (!condition) {
            return '';
        }
        // Step 1: Handle parent fields (e.g., [Parent__Name] -> recordFields["parent__Name"])
        let transformed = condition.replace(/\[Parent\./g, 'recordFields["parent__');
        // Step 2: Handle regular child fields (e.g., [Phone] -> recordFields["Phone"])
        transformed = transformed.replace(/\[([a-zA-Z0-9_]+)\]/g, 'recordFields["$1"]');
        // Step 3: Add closing bracket for parent fields
        transformed = transformed.replace(/parent\.([a-zA-Z0-9_]+)\]/g, 'parent__$1"]');
        return transformed;
    }

    evaluateCondition(recordFields, condition) {
        try {
            // Create a dynamic function with the condition and execute it
            const dynamicFunction = new Function('recordFields', `return ${condition};`);
            return dynamicFunction(recordFields);
        } catch (error) {
            console.error('Error evaluating condition:', error);
            return false; // Handle condition evaluation errors
        }
    }

    applyConditionResults(recordId, fieldName, conditions) {
        const { hidden, readonly, mandatory } = conditions;
        // Your logic to apply hidden, readonly, and mandatory conditions for each field
        // For example, updating UI elements or setting the appropriate CSS classes
        const fieldElement = this.template.querySelector(`[data-fieldname="${fieldName}"][data-tempid="${recordId}"]`);
        if (fieldElement) {
            fieldElement.style.display = hidden ? 'none' : '';
            fieldElement.disabled = readonly;
            fieldElement.required = mandatory;
            fieldElement.isreadonly = readonly; //for custom picklist
            fieldElement.isrequired = mandatory; //for custom picklist
        }

    }

    transformDetailToRecord(detail) {
        const record = {
            apiName: detail.apiName,
            childRelationships: detail.childRelationships,
            fields: {},
            id: detail.id,
            lastModifiedById: detail.lastModifiedById,
            lastModifiedDate: detail.lastModifiedDate,
            recordTypeId: detail.recordTypeId,
            recordTypeInfo: detail.recordTypeInfo,
            systemModstamp: detail.systemModstamp
        };

        // Loop through each field in extractedFields and add it to the record.fields object
        this.fieldNames.forEach(fieldApiName => {
            const fieldValue = detail.fields[fieldApiName] ? detail.fields[fieldApiName].value : null;
            record.fields[fieldApiName] = fieldValue;
            //record.fields[Id] = detail.id;
        });
        record.fields["Id"] = detail.id;
        return record;
    }

    handleAutocompleteChange(event) {
        // Extract field-specific information from the event
        const fieldName = event.target.dataset.fieldname; // Use the dataset to get field name
        const value = event.detail.value; // The selected value from the custom picklist
        const recordId = event.target.dataset.tempid; // Get the record's temp ID

        // Manually call handleFieldChange to update the record's fields in the same way
        this.handleFieldChange({
            target: {
                dataset: {
                    fieldname: fieldName,
                    tempid: recordId
                },
                value: value
            }
        });
    }

}
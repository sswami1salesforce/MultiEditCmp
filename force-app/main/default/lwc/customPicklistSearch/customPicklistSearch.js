import { LightningElement, api, track, wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';

export default class Autocomplete extends LightningElement {
    @api fieldApiName = {}; // API name of the field to fetch picklist values for
    @api recordTypeId = ''; // Record Type ID for the object
    // @api values = []; // List of dropdown values
    @api label = '';
    @api name = '';
    //  @api value = '';
    @api required = false;
    @api placeholder = '';
    @api fields;
    @api defaultRecordTypeId = '';
    @api isreadonly = false; // Read-only flag
    @api isrequired = false;

    @track values = []; // List of dropdown values
    @track isDropdownVisible = false; // Controls dropdown visibility
    @track filteredValues = []; // Filtered values for dropdown
    @track isSelectionLocked = false; // If true, input is locked after selection
    @track value = '';

    connectedCallback() {
        if (!this.recordTypeId) {
            this.recordTypeId = this.defaultRecordTypeId;
        }

        if (this.fields && this.name) {
            // Safely assign value from fields, or use an empty string if undefined
            this.value = this.fields[this.name] || '';
        } else {
            // If fields is undefined, set value to an empty string
            this.value = '';
        }

        // If value is found, set it as the selected value
        if (this.value != '') {
            this.isDropdownVisible = false;
            this.isSelectionLocked = true; // Lock selection
        }

        // Set initial filtered values to the full list
        this.filteredValues = [...this.values];

    }

    @wire(getPicklistValues, { recordTypeId: '$effectiveRecordTypeId', fieldApiName: '$fieldApiName' })
    picklistResults({ error, data }) {
        if (data) {
            this.values = data.values;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.values = [];
        }
    }

    @api
    reportValidity() {
        const inputElement = this.template.querySelector('input');
        const isRequired = this.isrequired === 'true' || this.isrequired === true;
        const isValid = inputElement.value.trim() !== ''; // Check if the input has any non-whitespace characters
    
        // Set or clear the custom error message based on validation
        inputElement.setCustomValidity(isRequired && !isValid ? 'Please fill in this field.' : '');
    
        inputElement.reportValidity(); // Display the validation result
    
        return isValid || !isRequired; // Return true if valid or not required
    }
    

    get inputClass() {
        return this.isSelectionLocked ? 'input input-locked' : 'input';
    }

    get isInputDisabled() {
        // Check both string and boolean representations of true for `isreadonly`
        const isReadOnly = this.isreadonly === 'true' || this.isreadonly === true;

        // Return true if either `isreadonly` or `isSelectionLocked` is true
        return isReadOnly || this.isSelectionLocked;
    }

    handleInput(event) {
        if (this.isInputDisabled) return; // Don't allow typing if selection is locked

        const inputValue = event.target.value;
        this.value = inputValue;

        // Filter values based on input
        if (inputValue) {
            this.filteredValues = this.values.filter(item =>
                item.value.toLowerCase().includes(inputValue.toLowerCase())
            );
        } else {
            this.filteredValues = [...this.values]; // Show full list if input is empty
        }

        // Show dropdown if there are matches
        this.isDropdownVisible = this.filteredValues.length > 0;
    }

    handleFocus() {
        if (this.isInputDisabled == 'false' || !this.isInputDisabled) {
            if (!this.value) {
                // If input is empty, show full list of values
                this.filteredValues = [...this.values];
            }
            this.isDropdownVisible = this.filteredValues.length > 0;
        }
    }

    handleSelect(event) {
        const selectedValue = event.currentTarget.dataset.value;
        this.value = selectedValue;
        this.isDropdownVisible = false;
        this.isSelectionLocked = true; // Lock selection

        // Dispatch custom change event
        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: this.value, target: this.name }
        }));
    }

    handleBlur() {
        setTimeout(() => {
            this.isDropdownVisible = false;
        }, 200);
    }

    clearSelection() {
        if (this.isreadonly === 'true' || this.isreadonly === true) return;
        this.value = ''; // Clear the value 
        this.isSelectionLocked = false; // Unlock input field
        this.filteredValues = [...this.values]; // Reset to full list of values
        this.isDropdownVisible = false;

        // Dispatch custom clear event
        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: '', target: this.name }
        }));
    }

    get effectiveRecordTypeId() {
        return this.recordTypeId || this.defaultRecordTypeId;
    }
}

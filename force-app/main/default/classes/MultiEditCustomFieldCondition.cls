public class MultiEditCustomFieldCondition {

    @AuraEnabled public String recordId;
    @AuraEnabled public String fieldName; // Optional for record-level conditions
    @AuraEnabled public Boolean hidden;
    @AuraEnabled public Boolean readonly;
    @AuraEnabled public Boolean mandatory;

    @AuraEnabled public Boolean saveRecordCondition;    // New for Save button conditions
    @AuraEnabled public Boolean deleteRecordCondition;  // New for Delete button conditions

    // Constructor for field-level conditions
    public MultiEditCustomFieldCondition(String recordId, String fieldName, Boolean hidden, Boolean readonly, Boolean mandatory) {
        this.recordId = recordId;
        this.fieldName = fieldName;
        this.hidden = hidden;
        this.readonly = readonly;
        this.mandatory = mandatory;
    }

    // Constructor for record-level conditions (save and delete)
    public MultiEditCustomFieldCondition(String recordId, Boolean saveRecordCondition, Boolean deleteRecordCondition) {
        this.recordId = recordId;
        this.saveRecordCondition = saveRecordCondition;
        this.deleteRecordCondition = deleteRecordCondition;
    }
}
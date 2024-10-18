public with sharing class MultiEditCmpController {
    @AuraEnabled(cacheable=true)
    public static List<FieldConditionsWrapper> getFieldConditions(String objectApiName, String relatedListUniqueName) {
        List<FieldConditions__c> fieldConditions = [
            SELECT Id, FieldName__c, HiddenCondition__c, ReadonlyCondition__c, NewCondition__c, DeleteCondition__c, MandatoryCondition__c, EditCondition__c 
            FROM FieldConditions__c WHERE RelatedLIstUniqueName__c = :relatedListUniqueName AND Active__c = true
        ];

        List<FieldConditionsWrapper> wrappedConditions = new List<FieldConditionsWrapper>();
        for (FieldConditions__c condition : fieldConditions) {
            wrappedConditions.add(new FieldConditionsWrapper(
                condition.Id,
                condition.FieldName__c,
                condition.HiddenCondition__c,
                condition.ReadonlyCondition__c,
                condition.MandatoryCondition__c,
                condition.NewCondition__c,
                condition.DeleteCondition__c,
                condition.EditCondition__c
            ));
        }

        return wrappedConditions;
    }

    public class FieldConditionsWrapper {
        @AuraEnabled public String recordId;
        @AuraEnabled public String fieldName;
        @AuraEnabled public String hiddenCondition;
        @AuraEnabled public String readonlyCondition;
        @AuraEnabled public String mandatoryCondition;
        @AuraEnabled public String newRecordCondition;
        @AuraEnabled public String deleteRecordCondition;
        @AuraEnabled public String editRecordCondition;

        public FieldConditionsWrapper(String recordId, String fieldName, String hiddenCondition, String readonlyCondition, string mandatoryCondition, string newRecordCondition, string deleteRecordCondition, string editRecordCondition) {
            this.recordId = recordId;
            this.fieldName = fieldName;
            this.hiddenCondition = hiddenCondition;
            this.readonlyCondition = readonlyCondition;
            this.mandatoryCondition = mandatoryCondition;
            this.newRecordCondition = newRecordCondition;
            this.deleteRecordCondition = deleteRecordCondition;
            this.editRecordCondition = editRecordCondition;
        }
    }

    @AuraEnabled
    public static SObject getParentRecord(Id parentRecordId, List<String> fields) {
        // Ensure that fields is not empty or null
        if (fields == null || fields.isEmpty()) {
            throw new AuraHandledException('No fields provided for parent record query.');
        }
        
        // Construct the dynamic SOQL query to get only the requested fields
        String query = 'SELECT ';
        
        // Join the fields into a comma-separated string
        query += String.join(fields, ', ');
        
        // Add the FROM clause with the parent object's API name
        String parentObjectApiName = parentRecordId.getSObjectType().getDescribe().getName();
        query += ' FROM ' + parentObjectApiName + ' WHERE Id = :parentRecordId LIMIT 1';
        
        // Apply field-level security using Security.stripInaccessible
        SObject securedRecord;
        try {
            securedRecord = Security.stripInaccessible(AccessType.READABLE, Database.query(query)).getRecords()[0];
        } catch (Exception e) {
            throw new AuraHandledException('Error querying parent record: ' + e.getMessage());
        }
        
        // Return the secured SObject record
        return securedRecord;
    }


    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getPicklistFields(String sObjectName, String fieldsString) {
        Map<String, Object> result = new Map<String, Object>();
        Map<String, String> picklistFields = new Map<String, String>();
        String defaultRecordTypeId = '';

        // Split the fieldsString into a list of field API names
        List<String> fieldApiNames = fieldsString != null ? fieldsString.split(',') : new List<String>();

        // Get the describe information for the object
        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(sObjectName);
        Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();

        // Get the record type information
        List<Schema.RecordTypeInfo> recordTypeInfos = describeResult.getRecordTypeInfos();
        for (Schema.RecordTypeInfo recordTypeInfo : recordTypeInfos) {
            if (recordTypeInfo.isDefaultRecordTypeMapping()) {
                defaultRecordTypeId = recordTypeInfo.getRecordTypeId();
                break;
            }
        }

        // Loop through the requested fields and check if they are picklist fields
        for (String fieldApiName : fieldApiNames) {
            // Remove any leading/trailing whitespace
            fieldApiName = fieldApiName.trim();
            
            // Check if the field exists in the object's schema
            Schema.SObjectField field = describeResult.fields.getMap().get(fieldApiName);
            if (field != null) {
                Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
                
                // Check if the field type is picklist
                if (fieldDescribe.getType() == Schema.DisplayType.Picklist) {
                    picklistFields.put(fieldApiName, fieldDescribe.getLabel());
                }
            }
        }

        // Add picklist fields and default RecordTypeId to the result map
        result.put('picklistFields', picklistFields);
        result.put('defaultRecordTypeId', defaultRecordTypeId);

        return result; // Returning picklist fields and default RecordTypeId
    }

    @AuraEnabled
    public static List<String> getAvailableFilters(String apexClassName) {
        MultiEditCustomFiltersInterface filter = (MultiEditCustomFiltersInterface) Type.forName(apexClassName).newInstance();
        return filter.getAvailableFilters();
    }
    
    @AuraEnabled
    public static List<Id> applyCustomFilter(String apexClassName, String filterName, List<Id> recordIds) {
        MultiEditCustomFiltersInterface filter = (MultiEditCustomFiltersInterface) Type.forName(apexClassName).newInstance();
        return filter.filterRecords(filterName, recordIds);
    }

    @AuraEnabled
    public static MultiEditCustomConditionsResponse getCustomFieldConditions(Map<String, Map<String, Object>> records, String apexClassName) {
        // Fetch the class implementing the interface
        MultiEditCustomConditionsInterface conditionProvider = (MultiEditCustomConditionsInterface) Type.forName(apexClassName).newInstance();

        // Use the interface method to get the field and record-level conditions
        MultiEditCustomConditionsResponse response = conditionProvider.calculateFieldConditions(records);

        return response;
    }

    @AuraEnabled
    public static MultiEditSaveResponse handleCustomSave(Map<Object, Object> recordData, String apexClassName) {
        // Fetch the class implementing the custom save interface
        MultiEditCustomSaveInterface saveHandler = (MultiEditCustomSaveInterface) Type.forName(apexClassName).newInstance();
        
        // Safely extract necessary fields from the incoming recordData
        String objectApiName = (String)recordData.get('objectApiName');
        String recordId = (String)recordData.get('recordId');
        
        // Extract fields as Map<Object, Object> first
        Map<Object, Object> rawFields = (Map<Object, Object>)recordData.get('fields');

        // Cast rawFields to Map<String, Object> to avoid conversion errors
        Map<String, Object> fields = new Map<String, Object>();
        for (Object key : rawFields.keySet()) {
            fields.put((String)key, rawFields.get(key));
        }

        // Handle the logic based on whether it's a new record or an existing one
        MultiEditSaveResponse response;
        if (recordId != null && recordId.startsWith('temp_')) {
            // Handle insertion logic
            response = saveHandler.saveNewRecord(objectApiName, fields);
        } else {
            // Handle update logic
            response = saveHandler.updateRecord(recordId, objectApiName, fields);
        }
        
        return response;
    }

}
public class MultiEditCustomConditionsResponse {
    @AuraEnabled public List<MultiEditCustomFieldCondition> fieldConditions;
    @AuraEnabled public Boolean newRecordCondition; // New condition for New button

    public MultiEditCustomConditionsResponse(List<MultiEditCustomFieldCondition> fieldConditions, Boolean newRecordCondition) {
        this.fieldConditions = fieldConditions;
        this.newRecordCondition = newRecordCondition;
    }
}
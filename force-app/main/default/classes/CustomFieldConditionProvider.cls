public class CustomFieldConditionProvider implements MultiEditCustomConditionsInterface {

    public MultiEditCustomConditionsResponse calculateFieldConditions(Map<String, Map<String, Object>> records) {
        List<MultiEditCustomFieldCondition> conditions = new List<MultiEditCustomFieldCondition>();
        Boolean newRecordCondition = false; // Default condition for New button

        for (String recordId : records.keySet()) {
            Map<String, Object> fields = records.get(recordId);

            // Example logic for field-level conditions
            Boolean isHighValue = (fields.containsKey('Phone') && (String)fields.get('Phone') == '88007');

            conditions.add(new MultiEditCustomFieldCondition(recordId, 'Phone', false, false, true)); // Phone mandatory
            conditions.add(new MultiEditCustomFieldCondition(recordId, 'Email', false, isHighValue, false)); // Email readonly if Phone is '88007'
            conditions.add(new MultiEditCustomFieldCondition(recordId, 'FirstName', isHighValue, false, false)); // Hide FirstName if Phone is '88007'

            // Example logic for record-level conditions (Save/Delete buttons)
            Boolean saveCondition = isHighValue;  // Example: Disable Save if Phone is '88007'
            Boolean deleteCondition = !isHighValue; // Example: Enable Delete if Phone is '88007'

            // Add record-level condition
            conditions.add(new MultiEditCustomFieldCondition(recordId, saveCondition, deleteCondition));
        }

        // Evaluate the condition for the New button
        newRecordCondition = true; // Example logic: Disable New

        return new MultiEditCustomConditionsResponse(conditions, newRecordCondition);
    }
}

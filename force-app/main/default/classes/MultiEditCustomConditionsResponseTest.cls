@IsTest
public class MultiEditCustomConditionsResponseTest {

    @IsTest
    static void testMultiEditCustomFieldCondition_FieldLevel() {
        // Test field-level conditions
        String recordId = '001000000000001';
        String fieldName = 'TestField';
        Boolean hidden = true;
        Boolean readonly = false;
        Boolean mandatory = true;

        // Create an instance of MultiEditCustomFieldCondition (field-level)
        MultiEditCustomFieldCondition fieldCondition = new MultiEditCustomFieldCondition(recordId, fieldName, hidden, readonly, mandatory);

        // Assert that the values are correctly set
        System.assertEquals(recordId, fieldCondition.recordId, 'Record ID should match.');
        System.assertEquals(fieldName, fieldCondition.fieldName, 'Field name should match.');
        System.assertEquals(hidden, fieldCondition.hidden, 'Hidden condition should match.');
        System.assertEquals(readonly, fieldCondition.readonly, 'Readonly condition should match.');
        System.assertEquals(mandatory, fieldCondition.mandatory, 'Mandatory condition should match.');
    }

    @IsTest
    static void testMultiEditCustomFieldCondition_RecordLevel() {
        // Test record-level conditions (Save and Delete button conditions)
        String recordId = '001000000000002';
        Boolean saveRecordCondition = true;
        Boolean deleteRecordCondition = false;

        // Create an instance of MultiEditCustomFieldCondition (record-level)
        MultiEditCustomFieldCondition recordCondition = new MultiEditCustomFieldCondition(recordId, saveRecordCondition, deleteRecordCondition);

        // Assert that the values are correctly set
        System.assertEquals(recordId, recordCondition.recordId, 'Record ID should match.');
        System.assertEquals(saveRecordCondition, recordCondition.saveRecordCondition, 'Save record condition should match.');
        System.assertEquals(deleteRecordCondition, recordCondition.deleteRecordCondition, 'Delete record condition should match.');
    }

    @IsTest
    static void testMultiEditCustomConditionsResponse() {
        // Create field conditions (field-level)
        List<MultiEditCustomFieldCondition> fieldConditions = new List<MultiEditCustomFieldCondition>{
            new MultiEditCustomFieldCondition('001000000000001', 'TestField1', false, false, true),
            new MultiEditCustomFieldCondition('001000000000002', 'TestField2', true, false, false)
        };

        Boolean newRecordCondition = true;

        // Create an instance of MultiEditCustomConditionsResponse
        MultiEditCustomConditionsResponse response = new MultiEditCustomConditionsResponse(fieldConditions, newRecordCondition);

        // Assert that the values are correctly set
        System.assertEquals(fieldConditions, response.fieldConditions, 'Field conditions list should match.');
        System.assertEquals(newRecordCondition, response.newRecordCondition, 'New record condition should match.');
    }
}

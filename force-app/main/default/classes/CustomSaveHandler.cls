public class CustomSaveHandler implements MultiEditCustomSaveInterface {

    public MultiEditSaveResponse saveNewRecord(String objectApiName, Map<String, Object> fields) {
        try {
            // Dynamically create an instance of the SObject based on the objectApiName
            SObject sObjectInstance = (SObject)Type.forName('Schema.' + objectApiName).newInstance();

            // Iterate over the fields and set the values dynamically
            for (String fieldName : fields.keySet()) {
                  sObjectInstance.put(fieldName, fields.get(fieldName));
                }
            // Perform the insert operation
            insert sObjectInstance;

            // Return success response with the SObject's ID
            return new MultiEditSaveResponse(true, 'Record created successfully', sObjectInstance.Id);

        } catch (Exception ex) {
            // Handle any general exceptions
            return new MultiEditSaveResponse(false, 'Error saving the record: ' + ex.getMessage(), null);
        }
    }

    public MultiEditSaveResponse updateRecord(String recordId, String objectApiName, Map<String, Object> fields) {
        try {
            // Fetch the existing SObject instance to update
            SObject sObjectInstance = (SObject)Type.forName('Schema.' + objectApiName).newInstance();
            sObjectInstance.put('Id', recordId); // Set the Id of the record to update

            // Iterate over the fields and set the values dynamically
            for (String fieldName : fields.keySet()) {
                sObjectInstance.put(fieldName, fields.get(fieldName));
            }

            // Perform the update operation
            update sObjectInstance;

            // Return success response
            return new MultiEditSaveResponse(true, 'Record updated successfully', recordId);

        } catch (Exception ex) {
            // Handle any general exceptions
            return new MultiEditSaveResponse(false, 'Error updating the record: ' + ex.getMessage(), null);
        }
    }
}
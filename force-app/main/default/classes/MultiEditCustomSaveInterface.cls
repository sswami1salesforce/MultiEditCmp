public interface MultiEditCustomSaveInterface {
    MultiEditSaveResponse saveNewRecord(String objectApiName, Map<String, Object> fields);
    MultiEditSaveResponse updateRecord(String recordId, String objectApiName, Map<String, Object> fields);
}
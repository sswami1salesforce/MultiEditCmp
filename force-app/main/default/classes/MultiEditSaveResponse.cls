public class MultiEditSaveResponse {
	@AuraEnabled public Boolean success;
    @AuraEnabled public String message;  // Could be used for success message or error message
    @AuraEnabled public String recordId; // The saved record ID (if success)
    
    public MultiEditSaveResponse(Boolean success, String message, String recordId) {
        this.success = success;
        this.message = message;
        this.recordId = recordId;
    }
}
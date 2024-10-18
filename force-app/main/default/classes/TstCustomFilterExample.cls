public class TstCustomFilterExample implements MultiEditCustomFiltersInterface {
     // Implement the filtering logic for multiple filters
     public List<Id> filterRecords(String filterName, List<Id> recordIds) {
        if (filterName == 'Tst Name Filter') {
            return applyTestNameFilter(recordIds);
        } else if (filterName == 'Recent Records Filter') {
            return applyRecentRecordsFilter(recordIds);
        }
        return recordIds; // Default: no filtering
    }
    
    // Return the available filter names for display
    public List<String> getAvailableFilters() {
        return new List<String>{ 'Tst Name Filter', 'Recent Records Filter' };
    }
    
    // Example filter 1: Filter records where Name starts with 'Test'
    private List<Id> applyTestNameFilter(List<Id> recordIds) {
        System.debug('applyTestNameFilter');
        List<SObject> filteredRecords = [SELECT Id FROM Contact WHERE Id IN :recordIds AND FirstName LIKE 'Tst%'];
        return new List<Id>(new Map<Id, SObject>(filteredRecords).keySet());
    }
    
    // Example filter 2: Filter records created in the last 30 days
    private List<Id> applyRecentRecordsFilter(List<Id> recordIds) {
        List<SObject> filteredRecords = [SELECT Id FROM Contact WHERE Id IN :recordIds AND CreatedDate = LAST_N_DAYS:30];
        return new List<Id>(new Map<Id, SObject>(filteredRecords).keySet());
    }
}
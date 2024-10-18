public interface MultiEditCustomFiltersInterface {
	// Accepts a filter name and recordIds, returns the filtered record Ids
    List<Id> filterRecords(String filterName, List<Id> recordIds);

    // Returns a list of available filters (for display purposes)
    List<String> getAvailableFilters();
}
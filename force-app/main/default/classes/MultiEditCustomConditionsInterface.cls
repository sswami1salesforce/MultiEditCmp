public interface MultiEditCustomConditionsInterface {
	// This method should take the records and return a list of conditions for each field
    MultiEditCustomConditionsResponse calculateFieldConditions(Map<String, Map<String, Object>> records);
}
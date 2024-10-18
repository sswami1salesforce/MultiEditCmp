# Multi Edit Component Documentation

## Introduction
The Multi Edit component, encapsulated within the main component called `multiEdit`, offers users the ability to edit multiple records simultaneously and add new multiple records with ease, all within Lightning Record Pages. By configuring specific properties and applying field conditions, users can tailor the Multi Edit component to their requirements, defining which objects and fields are displayed, manipulated, and under what conditions.

## Configuration Properties
Below are the properties that need to be configured while embedding the Multi Edit (multiEdit) component on a Lightning Record Page:

- **relatedListObject:** This property specifies the API name of the related list to be displayed. Example value: `Inspections__r`.
- **relatedListLabel:** Specifies the label for the related list. Example value: `Inspections`.
- **relatedObjectApiName:** Indicates the API name of the related object. Example value: `Inspection__c`.
- **parentField:** Specifies the API name of the parent field. Example value: `Case__c`.
- **fieldsString:** Lists the fields to be displayed in the Multi Edit component, separated by commas. Example value: `Id,Name,Status__c,Stock__c,Case__c`.

## Field Conditions
The Multi Edit component supports applying conditions to fields through the use of the `FieldConditions__c` object. These conditions allow for the hiding, making a field read-only, or making it required based on specified criteria.

**Conditions Format:**

Conditions should be added in the following format:

[`<fieldapiname>`] `<conditional operator>` `<value>`


Where:
- `<fieldapiname>` refers to the API name of the field.
- `<conditional operator>` denotes the comparison operator to be used (e.g., ===, !==, >, <, etc.).
- `<value>` represents the value against which the field's value will be compared.

**Example:**

Consider the following example condition:

[Priority] === 'High' && [Status] === 'New'


This condition signifies that if the field `Priority` equals 'High' and the field `Status` equals 'New', the specified action (hide, read-only, or required) will be applied to the respective field.

## Conclusion
The Multi Edit component enhances user productivity by enabling simultaneous editing of multiple records and adding new multiple records seamlessly within Lightning Record Pages. By configuring the provided properties and applying field conditions, users can customize the component to meet their specific business requirements effectively.

<a href="https://githubsfdeploy.herokuapp.com?owner=sswami1salesforce&repo=MultiEditCmp&ref=main">
  <img alt="Deploy to Salesforce"
       src="https://raw.githubusercontent.com/afawcett/githubsfdeploy/master/deploy.png">
</a>
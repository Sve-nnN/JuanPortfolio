# features/example.feature
Feature: Example Feature
  As a user
  I want to see an example
  So that I understand how Cucumber works

  Scenario: Simple addition
    Given I have a number 5
    And I have another number 3
    When I add them together
    Then the result should be 8

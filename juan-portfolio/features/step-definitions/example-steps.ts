// features/step-definitions/example-steps.ts
import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

let num1: number
let num2: number
let result: number

Given('I have a number {int}', function (number: number) {
  num1 = number
})

Given('I have another number {int}', function (number: number) {
  num2 = number
})

When('I add them together', function () {
  result = num1 + num2
})

Then('the result should be {int}', function (expectedResult: number) {
  expect(result).to.equal(expectedResult)
})

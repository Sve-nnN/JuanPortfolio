// features/support/world.ts
import { setWorldConstructor, World } from '@cucumber/cucumber'

class CustomWorld extends World {
  // You can add properties and methods here that you want to share across step definitions
  // For example:
  // public browser: Browser | undefined;
  // public page: Page | undefined;

  constructor(options: any) {
    super(options)
  }
}

setWorldConstructor(CustomWorld)

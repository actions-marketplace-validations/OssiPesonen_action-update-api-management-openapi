import { action } from './action';

// This file simply acts as an entrypoint to run the action
async function run(): Promise<void> {
  await action();
}

run();

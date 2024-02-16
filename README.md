# Stack

As a C++ software developer / databricks backtest runner, I occasionally have long-running tasks that take unpredictable amounts of time. I want to have an automated way of alerting me when those tasks are complete.

## Installation
Requirements: node/npm on your system

1. Clone this folder to somewhere out of the way.
3. Run `npm install .`
4. Run the server: `./server.js`
5. Open the webapp according to the console output.
6. Set up the bash task pusher.
    1. Run `./bash-tracker.sh`
7. Set up userscripts.
    1. Download the fantastic Tampermonkey extension from the chrome web store: https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
    2. Create a userscript for the target website.
    3. Copy the contents of `userscript.js` into your userscript body.
    4. Update the task creation and mark-as-done 


## How it works


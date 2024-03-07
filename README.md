# Stack

As a C++ software developer / databricks backtest runner, I occasionally have long-running tasks that take unpredictable amounts of time. I want to have an automated way of alerting me when those tasks are complete.

## Installation

Requirements: node/npm on your system

1. Clone this folder to somewhere out of the way.
2. Run `npm install .`
3. Run the server: `./server.js`
   - You may want to use a https server (even a self-signed one) as this will allow userscripts from https sites to send requests to your server. To do this:
       1. `openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -nodes -subj "/C=XX/ST=StateName/L=CityName/O=CompanyName/OU=CompanySectionName/CN=CommonNameOrHostname"`
       2. Run instead with `HTTPS=true ./server.js`
4. Open the webapp according to the console output.
5. Set up the bash task pusher.
    1. Run `./bash-tracker.sh`
6. Set up userscripts.
    1. Download the fantastic Tampermonkey extension from the chrome web store: <https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo>
    2. Create a userscript for the target website.
    3. Copy the contents of `userscript.js` into your userscript body.
    4. Update the task creation and mark-as-done

## How it works

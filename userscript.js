const SERVER_URL = "http://localhost:6234"
const THIS_INSTANCE_ID = Date.now();
function alertTask(taskName, start_or_stop = "start") {
    fetch(`${SERVER_URL}/status?shell_id=${THIS_INSTANCE_ID}&cmd=${taskName}&start_or_stop=${start_or_stop}&ttl=3000`, {method: "POST"})
}

const start_condition = () => {
    // Write a method that returns true if there is a running task
}

const stop_condition = () => {
    // Write a method that returns true once the task has stopped.
}

setInterval(() => {
    if (stop_condition()) {
        alertTask(document.title, "stop");
    } else if (start_condition()) {
        alertTask(document.title, "start");
    }
}, 3000);
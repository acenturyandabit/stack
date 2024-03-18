
const toggle_state = (() => {
    let current_state = "YOU_DOING"
    let thread_id = undefined;
    const url = "https://localhost:6234" // or whichever
    const send_state = (thread_id, state) => {
        fetch(url + `/status?type=post-update&thread_id=${thread_id}&state=${state}`, { method: "POST" })
    }
    // Typically you want to send state of either COMPUTER_DOING or YOU_COULD_BE_DOING on task start or task end, you don't need to ping intermittently
    const toggle_state = (to_state) => {
        if (!thread_id) thread_id = prompt("Name for this job?")
        if (to_state != current_state) {
            send_state(thread_id, to_state)
            current_state = to_state;
        }
    }
    return toggle_state;
})()
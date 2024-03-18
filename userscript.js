const url = "https://localhost:6234" // or whichever
const send_state = (thread_id, state, command = "") => {
    fetch(url + `/status?type=post-update&thread_id=${thread_id}&state=${state}&command=${command}`, {method:"POST"})
}
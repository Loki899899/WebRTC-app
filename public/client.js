const userName = $('#user-name')
    room = $('#room-input')
    introPage = $('#room-selection-container')
    chatRoom = $('#chat-room-container')
    connectButton = $('#connect-button')
    socket = io()


let userId, roomId

// EVENT LISTERNERS====================================
connectButton.on('click', () => {
    joinRoom()
})


// SOCKET EVENT CALLBACKS==============================
socket.on('room_created', () => {
    console.log('room created')
    showChatRoom()
})

socket.on('room_joined', () => {
    console.log('room joined')
    showChatRoom()
})

socket.on('username-taken', () => {
    alert("username already taken")
})

socket.on('hangup', (user) => {
    console.log(user + ' left')
})

// FUNCTIONS===========================================
function joinRoom() {
    if (room.val() === '' || userName.val() == '') {
        alert('Both fields are REQUIRED')
    } else{
        userId = userName.val()
        roomId = room.val()
        socket.emit('join', roomId, userId)        
    }
}

function showChatRoom() {   
    introPage.toggleClass('disp-none')
    chatRoom.toggleClass('disp-none')
}
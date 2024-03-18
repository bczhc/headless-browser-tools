import * as net from "net";

// Create a TCP server
const server = net.createServer(socket => {
    console.log('Client connected');

    // Write lines periodically to the client
    const interval = setInterval(() => {
        socket.write('This is a periodic message\n');
    }, 2000); // Adjust the interval (in milliseconds) as needed

    // Handle client disconnection
    socket.on('end', () => {
        console.log('Client disconnected');
        clearInterval(interval); // Clear the interval when the client disconnects
    });

    // Handle errors
    socket.on('error', (err) => {
        console.error('Socket error:', err.message);
    });
});

// Listen for connections on port 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

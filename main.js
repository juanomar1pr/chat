const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require("express-session")
const csurf = require("csurf")
const app = express();
const path = require("path")
const server = http.createServer(app);
const io = socketIo(server);
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "public"))
app.use(express.urlencoded({ extended: false }))
app.use(
  session({
    // You could actually store your secret in your .env file - but to keep this example as simple as possible...
    secret: "supersecret difficult to guess string",
    cookie: {},
    resave: false,
    saveUninitialized: false
  })
)

app.use(express.static(__dirname + '/public')); // Carpeta de archivos estáticos
app.use(csurf())
function timepo(req, res, next){
req.vtiempo = true
next()
}

 
app.get('/', timepo,(req, res) => {
  let name = "Guest"

	  if (req.session.user) name = req.session.user

  res.send(`
  <h1>Bienvenid@!, ${name}</h1>
  <form action="/choose-name" method="POST">
    <input type="text" name="name" placeholder="Your name" autocomplete="off">
    <input type="hidden" name="_csrf" value="${req.csrfToken()}">
    <button>Entrar</button>
  </form>
  <form action="/logout" method="POST">
    <input type="hidden" name="_csrf" value="${req.csrfToken()}">
    <button>Logout</button>
  </form>
  <p>${req.vtiempo ? "arriba": "abajo"}</p>
  `)
})

app.post("/choose-name", (req, res) => {
  req.session.user = req.body.name.trim()
  res.send(`<p>Gracias acepta los terminos y condiciones </p> <a href="/success">Entrar</a>`)
})
app.get('/success', function (req, res) {
  res.render(__dirname + '/public/chat.ejs', { vtiempo: req.session.user })
})
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    res.redirect("/")
  })

  
});

let connectedUsers = 0;

// Manejador de conexiones de WebSocket
io.on('connection', (socket) => {
  console.log('Usuario conectado');
  connectedUsers++;

  // Cuando un usuario se conecta, actualizamos el número de usuarios conectados
  io.emit('update-users', connectedUsers);

  // Manejar desconexiones
  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
    connectedUsers--;

    // Cuando un usuario se desconecta, actualizamos el número de usuarios conectados
    io.emit('update-users', connectedUsers);
  });

  // Manejar mensajes de chat
  socket.on('chat-message', (message) => {
    // Emitir el mensaje a todos los usuarios en la sala
    io.emit('message', message);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Servidor en ejecución en el puerto ${port}`);
});

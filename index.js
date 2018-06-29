var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http); //引入io
var port = process.env.PORT || 3000;
// console.log(process.env);

// app.get('/', function (req, res) {
//     res.send('<h1>Hello world</h1>');
// });

var userList = [];

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
//io 针对所有用户，socket出发当前用户
io.on('connection', function (socket) {
    console.log('a user connected');
    socket.nickName = '未知用户';
    //登录
    socket.on('login', function (data) {
        let name = data.name;
        let msg = '欢迎' + name + '进入聊天室！';
        let ifCan = ifNew(userList, name);
        let reMsg = {
            name: '系统通知',
            text: msg,
            num: userList.length
        };
        if (ifCan) {
            console.log(ifCan + ',' + name + ',新人加入');
            // 设置当前用户的 nickName
            socket.nickName = name;
            io.emit('sys', reMsg);
            socket.emit('login', {
                status: 'ok'
            });
        } else {
            socket.emit('login', {
                status: 'fail',
                text: '该昵称已存在！'
            });
        }
    });
    // 接收发送信息后广播给除自己外的所有人
    socket.on('chat message', function (msg) {
        socket.broadcast.emit('chat message', msg);
    });
    // 断开连接
    socket.on('disconnect', function () {
        console.log('user disconnected');
        let index = userList.indexOf(socket.nickName)
        if (index >= 0) userList.splice(index, 1)
        // 离开房间发送通知
        io.emit('sys', {
            name: '系统通知',
            text: socket.nickName + ' 离开了房间',
            num: userList.length
        })
        console.log(socket.nickName + '离开了房间')
        console.log('当前用户', userList)
    });
});

//判断是否重名
function ifNew(arr, name) {
    let len = arr.length;
    let userL = new Set(arr);
    userL.add(name);
    if (userL.size > len) {
        userList.push(name);
        return true;
    }
    return false;
}

http.listen(port, function () {
    console.log('listening on *:' + port);
});
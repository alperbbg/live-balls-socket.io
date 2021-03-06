app.controller('indexController',['$scope','indexFactory','configFactory', ($scope, indexFactory,configFactory) => {

    $scope.messages = [];
    $scope.players = { };
    
    $scope.init = () => {
        var n = 0, msg = 'Please enter username (Maximum limit 20)'
        let username;
        do {
            n++;
            if(n > 1) msg = "You had too many characters! \nPlease enter username (Maximum limit 20).";
            username = prompt(msg, "Name");
        }
        while (username.length > 20)

        if(username)
            initSocket(username);
        else
            return false
    };

    function scrollTop(){
        setTimeout(() => {
            const element = document.getElementById('chat-area');
            element.scrollTop = element.scrollHeight;
        });
    }

    function showBubble(id, message) {
        
        $('#' + id).find('.message').show().html(message);

        setTimeout(() => {
            $('#' + id).find('.message').hide();
        }, 2000);

    }

    async function initSocket(username) {
        const connectionOptions = {
            reconnectionAttempts: 3,
            reconnectionDelay: 600
        };

        try{

            const socketUrl = await configFactory.getConfig();
            const socket =  await indexFactory.connectSocket(socketUrl.data.socketUrl, connectionOptions);
            socket.emit('newUser', { username });

            socket.on('initPlayers',(players) => {
                $scope.players = players;
                $scope.$apply();
            });

            socket.on('newUser',(data)=> {
                const messageData = {
                    type: {
                        code: 0, // server(0) or user message(1)
                        message: 1 // disconnect message(0) or login(1)
                    },
                    username: data.username
                };

                $scope.messages.push(messageData);
                $scope.players[data.id] = data ;
                scrollTop();
                $scope.$apply();
            });

            socket.on('disUser', (user) => {
                const messageData = {
                    type: {
                        code: 0,
                        message: 0
                    }, // info
                    username: user.username
                };
                $scope.messages.push(messageData);
                delete $scope.players[user.id];
                scrollTop();
                $scope.$apply();   
            });

            socket.on('animate',data => {
                $('#'+ data.socketId).animate({ 'left': data.x, 'top': data.y }, () => {
                    animate = false;
                });
            });

            socket.on('newMessage', message => {
                $scope.messages.push(message);
                $scope.$apply();
                showBubble(message.socketId, message.text);
                scrollTop();
            });
                
            let animate = false; // to wait for the next animation
            $scope.onClickPlayer = ($event) => {
                if (!animate){
                    let x = $event.offsetX;
                    let y = $event.offsetY;

                    socket.emit('animate',{x, y});

                    animate = true;
                    $('#'+ socket.id).animate({ 'left': x, 'top': y }, () =>{
                        animate = false;
                    });
                }
            };

            $scope.newMessage = () => {
                let message = $scope.message;
                const messageData = {
                    type: {
                        code:1
                    }, 
                    username,
                    text: message
                };  

                if( messageData.text && messageData.text.length > 0 && messageData.text.length < 100 ) {

                    $scope.messages.push(messageData); 
                    socket.emit('newMessage', messageData);
                    showBubble(socket.id, message);
                    scrollTop();

                }else{
                    alert("Please type something in the message input \nor \nType less than 100 characters ");
                }
                $scope.message = null;
            };
        }catch(err){
        console.log(err);
    }
    }
}]);
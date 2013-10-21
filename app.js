// pcap and its stuff
var pcap = require('pcap'),
	util = require('util'),
	tcp_tracker = new pcap.TCP_tracker(),
	pcap_session = pcap.createSession('en0', "tcp port 80 or 443"),
	// find location / count how many times I send a request
	$ = require('jquery'),
	mongo = require('mongoskin'),
	db = mongo.db('localhost:27017/whereismydata?auto_reconnect', {
		safe: false
	}),
	selDb = function(collection) {
		return db.collection(collection);
	};

// webserver and socket.io
var connect = require('connect'),
	io = require('socket.io').listen(9001), // WS port
	port = 9000; // HTTP port
// WEB SERVER –––––––––––––––––––––––––––––––––––––––––––––––
connect.createServer(
	connect.static(__dirname + '/public') // two underscores
).listen(port);
util.log('the server is running on port: ' + port);

// SOCKET.IO

io.set('log level', 1);
io.sockets.on('connection', function(socket) {
	util.log('Ooooooh, someone just poked me :)');
});

// tcp stuff
tcp_tracker.on('start', function(session) {
	var time = new Date();
	var unixTime = time.getTime();
	var dst = session.dst_name;
	// find the index of colon
	var indexColon = dst.indexOf(':');
	var ip = session.dst_name.substring(0, session.dst_name.length - (session.dst_name.length - indexColon));
	util.log("at " + unixTime + " " + ip);
	if(ipArray.length == locData.length)
	checkIp(unixTime, ip);
});

// process
var ipArray = [],
	locData = [];
function checkIp(unix, ip) {
	if(ipArray.length == locData.length)
	io.sockets.emit('data', {'locData': locData, 'ipArray': ipArray});
	// io.sockets.emit('data', {'locData': locData});
	console.log('I got an ip of ' + ip);
	if($.inArray(ip, ipArray) === -1) { // if ip doesn't exist
		// console.log(ipArray);
		ipArray.push(ip);
		console.log('I just pushed ' + ip + 'to ipArray');
		
		$.ajax({
		url: 'http://freegeoip.net/json/' + ip,
		dataType: 'jsonp',
		type: 'GET',
		success: function(data) {
			console.log('I just got a location data');
			locData.push({
				ip: data.ip,
				lat: data.latitude,
				lng: data.longitude,
				city: data.city,
				country: data.country_name,
				hit: 1,
				bytesSent: 0
			});
			console.log('It\'s been pushed!');
		},
		error: function(request, status, error) {
			console.log('errrorerrrorerrrorerrrorerrror');
			// remove ipArray
			ipArray.pop();
		}
		});
	} else {
		if(ipArray.length == locData.length)
		console.log('you just hit index: ' + ipArray.indexOf(ip) + ' so no PUSH ');
		// update hit
		// console.log(ipArray.indexOf(ip));
		// console.log(locData[0]);
		// console.log(locData[0].hit);
		locData[ipArray.indexOf(ip)].hit++;
		// console.log(locData[ipArray.indexOf(ip)].hit);
	}

}

// -–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

tcp_tracker.on('end', function(session) {
	// console.log("End of TCP session between " + session.src_name + " and " + session.dst_name);
});

pcap_session.on('packet', function(raw_packet) {
	var packet = pcap.decode.packet(raw_packet);
	tcp_tracker.track_packet(packet);
	var pDst = packet.link.ip.daddr; // must be only external ip
	var pLen = packet.link.ip.tcp.data_bytes;
	console.log(pLen + ' bytes to ' + pDst);
	// check if pDst is exist in which index, then add bytes
	if($.inArray(pDst, ipArray) !== -1 && ipArray.length == locData.length) {
		// console.log('ip: ' + pDst + ' existed in ipArray at index: ' + ipArray.indexOf(pDst));
		console.log(pLen + ' bytes pushed ––––––––––––––––––––––––––');
		locData[ipArray.indexOf(pDst)].bytesSent += pLen;
	}
});
// ------------------------------------------------------------------------------
// Crawler service handler declaration
//


var http = require('http');
http.createServer(function (__req, __res) {
  var __uid = __req.headers['uid'];
  __res.connection.setTimeout(0);
  if((__req.headers['user-agent']=='local-Node.js') || (__req.headers['waybackfd']!=null))
  {
    __res.end = function(data) {

      var msg = {}
      msg.contentLength = Buffer.byteLength(data)
      msg.type = process.Globals.msgTypes.OPM_response
      msg.rawData = data
      msg.fuffa = exports.__channelID
      msg.emitOnDone = __req.headers['emitondone']
      msg.wayBackFD = __req.headers['waybackfd']
      msg.uid = __req.headers['uid']
      msg.toID = __req.headers['senderid']
      msg.from = 'indirect'

      exports.totOut++

      if(__req.headers['waybackfd']!=null) exports.totEnd++

      if(exports.conf.DEBUG.TrackCommunications) {
        if(__req.headers['waybackfd']!=null) console.log('// OPM <<< (RPP) <<< ' + JSON.stringify(msg));
        else console.log('// OPM <- ' + JSON.stringify(msg));
      }

      if(__res.socket)
      {
        if(__res.socket.writable) __res.socket.write(JSON.stringify(msg));
        else console.log('OPM: FATAL: sk not writ')
      }
      else console.log('OPM: FATAL: sk null!!!')
    }
  }
  else
  {
    var oldRes = __res.end
    __res.oldRes = oldRes
    __res.end = function(data) {

      exports.totOut++
      exports.totEnd++
      __res.oldRes(data)

      if(exports.conf.DEBUG.TrackCommunications) console.log('// OPM <<< ' + data);
    }
  }
  var __ls = exports.__seek++;
  var __inData;

  __req.on('data', function(d) { __inData+=d; console.log('received input data!') })

  __req.on('end', function()
  {
    //
    // Compiled handler code for
    //
    //      '/fibo'
    //

    // -- global symbols -- MODIFIED + ADDED SOMETHINF
    var schedulerClass = {};
    var SSS = {};
    // -- global control flow management --
    var __scheduler = SSS;  //exports.__scheduler;
    var __commScheduler = {};
    var __u = 0;
    var __callStack = new Array();

	//added stuff to avoid errors
	__scheduler.emit = function(){};
	__scheduler.execOn = function(){};
	__scheduler.exec = function(){};

    //
    //      on GET { ... }
    //
    if (__req.method == 'GET') {

        var ON1 = {} 
        var ON0 = {} 
        var ON1 = {} 
        var B = {}
        var L = {}

        var query = require('url').parse(__req.url, true).query
        //-- Block [#IB_0 = function(__event, __comingFromEvent, __r)]

        var IF_0 = function(__event, __comingFromEvent, __r) {
				//invece di exports.resourceManagerClass creare mia classe / whatever
				//per handlare TCC (ovvero quello che ho già fatto, fa spostato solo
				//in una classe a se che risponda con questi metodi e che prenda un __event)
                L.aRes_0 = new exports.resourceManagerClass.Resource()
                L.aRes_0.__init(exports.conf, __scheduler, __commScheduler, exports.__skPool, exports.__channelID, 'www.google.com', __uid)
                L.aRes_0.get__start(__event)
            }
        var IF_1 = function(__event, __comingFromEvent, __r) {
                L.tmpR_0 = L.aRes_0.get__result()
                ON1.a = L.tmpR_0
                L.aRes_1 = new exports.resourceManagerClass.Resource()
                L.aRes_1.__init(exports.conf, __scheduler, __commScheduler, exports.__skPool, exports.__channelID, 'www.a.b', __uid)
                L.aRes_1.get__start(__event)
            }
        var IF_2 = function(__event, __comingFromEvent, __r) {
                L.tmpR_1 = L.aRes_1.get__result()
                ON1.b = L.tmpR_1
                var __end = ON1.a + ON1.b +'' ;
                __res.writeHead(200, {
                    'Content-Length': Buffer.byteLength(__end),
                    'Content-Type': 'text/plain',
                    'fuffa': exports.__channelID,
                    'emitOnDone': __req.headers['emitOnDone']});
                __res.end(__end);
                __scheduler.emit(__event);
            }

        __scheduler.execOn('done_F_2'+__ls+__u, function() { __scheduler.emit('done_B_0'+__ls+__u) });
        __scheduler.execOn('done_F_1'+__ls+__u, IF_2, 'done_F_2'+__ls+__u);
        __scheduler.execOn('done_F_0'+__ls+__u, IF_1, 'done_F_1'+__ls+__u);
        __scheduler.exec(IF_0, 'done_F_0'+__ls+__u);
    }
  })
}).listen(1337, '127.0.0.1');
////////////////////////////////////////////////////////////////////////
// ShadowLoader
////////////////////////////////////////////////////////////////////////

var SS = require("lib/shadowsocks");
var SHELL = require("lib/shell");
var SYS = require("lib/system");
var XML = require("lib/xml");
var LDPlayer = require("lib/ldplayer");
var NoxPlayer = require("lib/noxplayer");
var Chrome = require("lib/chrome");

var Apps = {
	LDPlayer: {},
	NoxPlayer: {},
	Chrome: {},
	ProcessName: {}
};
var AppsMutex = [];
var AppsPID = [];

var getAvailablePID = function() {
	var items = [];
    var cmd = "tasklist | findstr .exe";
    var result = SHELL.exec(cmd);
    var lines = result.split(/\r?\n/);
    for(var i = 0; i < lines.length; i++) {
		var row = lines[i].split(/\s+/);
        items.push(row[1]);
	}
	return items;
};

var items = XML.load("staticip.xml").select("/StaticIP/Item").toArray();
for (var i = 0; i < items.length; i++) {
	try {
		var name = items[i].getDOM().selectSingleNode("Name").text;
		var uniqueId = items[i].getDOM().selectSingleNode("UniqueID").text;
		var ipAddress = items[i].getDOM().selectSingleNode("IPAddress").text;

		if (name in Apps) {
			Apps[name][uniqueId] = ipAddress;
		}
	} catch (e) {}
}

// App 1. LDPlayer
var check_LDPlayer = function() {
    var ssPort, ssPID, shadowPID = 0;
	var items = LDPlayer.getList();

	for (var i = 0; i < items.length; i++) {
		var pid = items[i].PIDVBox;
		var title = items[i].title;
		if (pid > 0 && AppsMutex.indexOf(pid) < 0) {
			console.info("New launched LDPlayer: " + title);
			AppsMutex.push(pid);

			if (title in Apps.LDPlayer) {
                var ss = SS.connect(Apps.LDPlayer[title]);
                ssPort = ss.listenPort;
                ssPID = ss.processID;
			} else {
				console.error("Not assigned static IP: " + title);
				continue;
			}

            var process;
            while (!(shadowPID > 0)) {
                process = SHELL.createProcess([
                    SYS.getCurrentScriptDirectory() + "/bin/shadow.exe",
                    "-c",
                    SYS.getCurrentScriptDirectory() + "/config.template.json",
                    "-s",
                    "socks://localhost:" + ssPort,
                    "-p",
                    pid
                ]);
                sleep(1000);
                shadowPID = process.ProcessID;
            }

            AppsPID.push([pid, ssPID, shadowPID]);

			console.info("Waiting new launched");
			sleep(3000);
		}
	}
};

// App 2. NoxPlayer
var check_NoxPlayer = function() {
    var ssPort, ssPID, shadowPID = 0;
	var items = NoxPlayer.getList();

	for (var i = 0; i < items.length; i++) {
		var pid = items[i].PID;
		var hostname = items[i].hostname;

		if (pid > 0 && AppsMutex.indexOf(pid) < 0) {
			console.info("New launched NoxPlayer: " + hostname);
			AppsMutex.push(pid);

			if (hostname in Apps.NoxPlayer) {
                var ss = SS.connect(Apps.NoxPlayer[hostname]);
                ssPort = ss.listenPort;
                ssPID = ss.processID;
			} else {
				console.error("Not assigned static IP: " + hostname);
				continue;
			}

            var process;
            while (!(shadowPID > 0)) {
                process = SHELL.createProcess([
                    SYS.getCurrentScriptDirectory() + "/bin/shadow.exe",
                    "-c",
                    SYS.getCurrentScriptDirectory() + "/config.template.json",
                    "-s",
                    "socks://localhost:" + ssPort,
                    "-p",
                    pid
                ]);
                sleep(1000);
                shadowPID = process.ProcessID;
            }

            AppsPID.push([pid, ssPID, shadowPID]);

			console.info("Waiting new launched");
			sleep(3000);
		}
	}
};

// App 3. Chrome
var check_Chrome = function() {
	for (var uniqueId in Apps.Chrome) {
		if (AppsMutex.indexOf("chrome_" + uniqueId) < 0) {
            console.info("Creating Chrome Shoutcut: " + uniqueId);

            // 바탕화면에 바로가기만 생성
            Chrome.create().setProfile(uniqueId, uniqueId).createShoutcut("https://google.com");
            AppsMutex.push("chrome_" + uniqueId);
		}
	}
};

// App 4. ProcessName
var check_ProcessName = function() {
    for (var uniqueId in Apps.ProcessName) {
        if (AppsMutex.indexOf("processName_" + uniqueId) < 0) {
            var ssPort, ssPID, shadowPID = 0;

            console.info("Running listener with process name: " + uniqueId);
            AppsMutex.push("processName_" + uniqueId);

            // 소켓 연결
            var ss = SS.connect(Apps.ProcessName[uniqueId]);
            ssPort = ss.listenPort;
            ssPID = ss.processID;

            // 프로세스 이름으로 실행
            var process;
            while (!(shadowPID > 0)) {
                process = SHELL.createProcess([
                    SYS.getCurrentScriptDirectory() + "/bin/shadow.exe",
                    "-c",
                    SYS.getCurrentScriptDirectory() + "/config.template.json",
                    "-s",
                    "socks://localhost:" + ssPort,
                    "-n",
                    uniqueId
                ]);
                sleep(1000);
                shadowPID = process.ProcessID;
            }

            AppsPID.push([ssPID, shadowPID]);
            sleep(3000);
        }
    }
};

var check_Zombie = function() {
    var alives = SYS.getPIDList();
    var zombies = [];

    // find dead processes
    var _AppsPID = [];
    for (var i = 0; i < AppsPID.length; i++) {
        var v1 = AppsPID[i];
        var isDead = false;

        for (var k = 0; k < v1.length; k++) {
            var v2 = v1[k];
            if (alives.indexOf(v2) < 0) {
                console.warn("Detected zombie: " + v2);
                console.warn("Will be kill all related processes.");
                zombies = zombies.concat(v1);
                isDead = true;
                break;
            }
        }

        if (!isDead) {
            _AppsPID.push(v1);
        }
    }
    AppsPID = _AppsPID;

    // kill zombie processes
    var _zombies = [];
    for (var i = 0; i < zombies.length; i++) {
        var pid = zombies[i];
        if (pid > 0) {
            try {
                SYS.killProcess(pid);
            } catch (e) {
                _zombies.push(pid);
                console.error("shadow -> check_Zombie() -> ", e.message);
            }
        }
    }
    zombies = _zombies;
};

var main = function() {
	console.info("Waiting new launched");

	while (true) {
		sleep(3000);
		check_LDPlayer();

		sleep(3000);
		check_NoxPlayer();

		sleep(3000);
        check_Chrome();

        sleep(3000);
        check_ProcessName();

        sleep(3000);
        check_Zombie();
	}
};

exports.main = main;

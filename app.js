//////////////////////////////////////////////////////////////////////////////////
//
//    app.js
//
//    Bootstrap code for running a javascript app in windows.  Run as:
//
//    cscript.js app.js <appname> <app arguments> ...
//
/////////////////////////////////////////////////////////////////////////////////
//"use strict";

/////////////////////////////////////////////////////////////////////////////////
// Bootstrap code, basic module loading functionality
/////////////////////////////////////////////////////////////////////////////////

//
//    The module loaded is run inside a function, with one argument, global which
//    points to the global context.  So global.FN is the same as FN (as long as a
//    version of FN does not exist in local scope).
//
//    The module should return its interface at the end of the script.  The basic
//    pattern for a module is:-
//
//    var module = { ... };
//    return module;
//
//    Or:-
//
//    return function() {
//    }
//
//    The appname argument causes <appname>.js to be loaded. The interface returned
//    must define main = function(args) {}, which is called once the module is
//    loaded.
var messages = [];

var console = {
    log: function(msg) {
        if (typeof(window) !== 'undefined') {
            if (typeof(window.jQuery) !== 'undefined') {
                window.jQuery.toast({
                    heading: "Information",
                    text: msg,
                    icon: "info"
                });
            } else {
                messages.push(msg);
            }
        } else if (typeof(WScript) !== 'undefined') {
            WScript.echo(msg);
        }
    },
    error: function(msg, status) {
        this.log(msg);
        if (typeof(WScript) !== 'undefined') {
            WScript.quit(status);
        }
    },
    info: function(msg) {
        this.log(msg);
    },
    warn: function(msg) {
        this.log(msg);
    }
};

function CreateObject(name) {
    return new ActiveXObject(name);
}

function require(FN) {
    var cache = require.__cache = require.__cache || {};
    if (FN.substr(FN.length - 3) !== '.js') FN += ".js";
    if (cache[FN]) return cache[FN];
    var FSO = CreateObject("Scripting.FileSystemObject");
    var T = null;
    try {
        var TS = FSO.OpenTextFile(FN, 1);
        if (TS.AtEndOfStream) return "";
        T = TS.ReadAll();
        TS.Close();
        TS = null;
    } catch (e) {
        console.error("LOAD ERROR! " + e.number + ", " + e.description + ", FN=" + FN, 1);
        return;
    }
    FSO = null;
    T = "(function(global){\n" + '"use strict";' + "\n" + T + "})(this);\n\n////@ sourceURL=" + FN;
    try {
        cache[FN] = eval(T);
    } catch (e) {
        console.error("PARSE ERROR! " + e.number + ", " + e.description + ", FN=" + FN, 1);
    }
    if ("VERSIONINFO" in cache[FN]) console.log(cache[FN].VERSIONINFO);
    return cache[FN];
}

/////////////////////////////////////////////////////////////////////////////////
// Load script, and call app.main()
/////////////////////////////////////////////////////////////////////////////////

function init_console() {
    var n = WScript.arguments.length;
    if (n > 0) {
        var args = [];
        for (var i = 0; i < n; i++) {
            args.push(WScript.arguments(i));
        }
        var name = args.shift();
        var app = require(name);
        if (app) {
            if (app.main) {
                var exitstatus = app.main.call(app, args);
                if (typeof exitstatus != undefined) {
                    WScript.quit(exitstatus);
                }
            } else {
                console.error("Error, missing main entry point in " + name + ".js", 1);
            }
        } else {
            console.error("Error, cannot find " + name + ".js", 1);
        }
    }
}

function init_window(name, args, w, h) {
    var app = require(name);

    // "set default size of window";
    if (typeof(w) !== "undefined" && typeof(h) !== "undefined") {
        window.resizeTo(w, h);
    }

    // "load app";
    if (app) {
        if (app.main) {
            var exitstatus = app.main.call(app, args);
            if (exitstatus > 0) {
                console.error("error", exitstatus);
            }
        } else {
            console.error("Error, missing main entry point in " + name + ".js", 1);
        }
    } else {
        console.error("Error, cannot find " + name + ".js", 1);
    }
}

function main() {
    if (typeof(window) === "undefined") {
        init_console();
    } else {
        console.log("welcome");
    }
}

main();

////////////////////////////////////////////////////////////////////////
// Shell API
////////////////////////////////////////////////////////////////////////
var FILE = require("lib/file");

var ShellObject = function() {
    this.interface = null;
    this.currentDirectory = null;
    this.workingDirectory = null;
    this.isElevated = false;
    this.isFork = false;
    this.isVisibleWindow = false;
    
    this.stdout = null;
    this.stderr = null;

    this.create = function() {
        try {
            this.interface = CreateObject("WScript.Shell");
            this.currentDirectory = this.interface.CurrentDirectory;
        } catch (e) {
            console.error("ShellObject.create() ->", e.message);
        }
        return this;
    };

    this.setWorkingDirectory = function(dirname) {
        if (typeof(dirname) === "string") {
            this.workingDirectory = dirname;
            this.interface.CurrentDirectory = this.workingDirectory;
            console.log("ShellObject.workingDirectory ->", this.workingDirectory);
        }
        return this;
    };

    this.setVisibleWindow = function(visible) {
        this.isVisibleWindow = visible;
        return this;
    };

    this.build = function(cmd) {
        if (typeof(cmd) === "string") {
            return cmd;
        } else if (typeof(cmd) === "object") {
            return cmd.map(function(s) {
                if (s == '') {
                    return "''";
                } else if (!/[ "=]/g.test(s)) {
                    return s;
                } else {
                    return "\"" + addslashes(s) + "\"";
                }
            }).join(' ');
        } else {
            return "";
        }
    };

    this.createProcess = function(cmd) {
        try {
            var c = this.build(cmd);
            console.log("ShellObject.createProcess() ->", c);
            return this.interface.Exec(c);
        } catch (e) {
            console.error("ShellObject.createProcess() ->", e.message);
        }
    };

    this.exec = function(cmd, stdOutPath, stdErrPath) {
        var stdout, stderr;
        var seed = parseInt(Math.random() * 10000);
        var stdOutPath = (typeof(stdOutPath) === "undefined" ? "tmp\\stdout_" + seed + ".txt" : stdOutPath);
        var stdErrPath = (typeof(stdErrPath) === "undefined" ? "tmp\\stderr_" + seed + ".txt" : stdErrPath);

        var c = "%comspec% /c (" + this.build(cmd) + ") 1> " + stdOutPath;
        //c += " 2>&1";
        c += " 2> " + stdErrPath;
        this.interface.Run(c, 0, true);
        console.log("ShellObject.exec() ->", c);
        sleep(1);

        if (FILE.fileExists(stdOutPath)) {
            stdout = FILE.readFile(stdOutPath, "utf-8");
            FILE.deleteFile(stdOutPath);
        }

        if (FILE.fileExists(stdErrPath)) {
            stderr = FILE.readFile(stdErrPath, "utf-8");
            FILE.deleteFile(stdErrPath);
        }

        this.stdout = stdout;
        this.stderr = stderr;

        console.log(c);
        //console.log("[stdout] " + stdout);
        //console.log("[stderr] " + stderr);

        return stdout;
    };

    this.run = function(cmd, fork) {
        var fork = (typeof(fork) !== "undefined") ? fork : true;
        var c = "%comspec% /q /c (" + this.build(cmd) + ")";
        console.log("ShellObject.run() ->", c);
        this.interface.Run(c, (!this.isVisibleWindow ? 0 : 1), !fork);
    };

    this.runAs = function(FN, args) {
        var oShell = CreateObject("Shell.Application");
        var _args = null;
        console.log("ShellObject.runAs() ->", FN);
        if (typeof(args) !== "undefined") {
            _args = args.join(' ');
        }
        oShell.shellExecute(FN, _args, this.workingDirectory, "runas", (!this.isVisibleWindow ? 0 : 1));
        return oShell;
    };

    this.createShoutcut = function(shoutcutName, cmd, workingDirectory) {
        var desktopPath = this.interface.SpecialFolders("Desktop");
        var path = desktopPath + "\\" + shoutcutName + ".lnk";

        if (!FILE.fileExists(path)) {
            var link = this.interface.CreateShortcut(path);
            //link.TargetPath = "cmd";
            //link.Arguments = "/q /c " + this.build(cmd);
            link.TargetPath = "wscript";
            link.Arguments = "bgloader.js " + this.build(cmd);
            //link.Arguments = this.build(cmd);
            link.WindowStyle = 1;
            link.WorkingDirectory = workingDirectory;
            //link.Hotkey = "";
            link.IconLocation = require("lib/system").getCurrentScriptDirectory() + "\\app\\favicon.ico";
            link.Save();
        }
    };

    this.getPathOfMyDocuments = function() {
        return this.interface.SpecialFolders("MyDocuments");
    };

    this.release = function() {
        console.log("ShellObject.release() ->", this.currentDirectory);
        this.interface.CurrentDirectory = this.currentDirectory;
        this.interface = null;
    };

    this.create();
};

exports.create = function() {
    return new ShellObject();
};

exports.build = function(cmd) {
    return (new ShellObject()).build(cmd);
};

exports.exec = function(cmd, stdOutPath) {
    return (new ShellObject()).exec(cmd, stdOutPath);
};

exports.run = function(cmd, fork) {
    return (new ShellObject()).run(cmd, fork);
};

exports.show = function(cmd, fork) {
    return (new ShellObject()).setVisibleWindow(true).run(cmd, fork);
};

exports.runAs = function(FN, args) {
    return (new ShellObject()).runAs(FN, args);
};

exports.showAs = function(FN, args) {
    return (new ShellObject()).setVisibleWindow(true).runAs(FN, args);
};

exports.createProcess = function(cmd, workingDirectory) {
    if (typeof(workingDirectory) !== "undefined") {
        console.log("Working directory: " + workingDirectory);
    }
    return (new ShellObject()).setWorkingDirectory(workingDirectory).createProcess(cmd);
};

exports.createDesktopIcon = function(name, cmd, workingDirectory) {
    return (new ShellObject()).createDesktopIcon(name, cmd, workingDirectory);
};

exports.getPathOfMyDocuments = function() {
    return (new ShellObject()).getPathOfMyDocuments();
};

exports.VERSIONINFO = "Shell interface (shell.js) version 0.2";
exports.global = global;
exports.require = global.require;

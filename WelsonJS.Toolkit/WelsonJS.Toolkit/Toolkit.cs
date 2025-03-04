﻿/*
 * WelsonJS.Toolkit: WelsonJS C#.NET native component
 * 
 *     description:
 *         WelsonJS - Build Windows desktop apps with JavaScript, HTML, and CSS based on WSH/HTA.
 *         https://github.com/gnh1201/welsonjs
 * 
 *     license:
 *         gnh1201/welsonjs is licensed under the Microsoft Public License (Ms-PL)
 * 
 *     references:
 *         - https://stackoverflow.com/questions/9004352/call-a-function-in-a-console-app-from-vbscript
 *         - https://stackoverflow.com/questions/9501022/cannot-create-an-object-from-a-active-x-component
 *         - https://stackoverflow.com/questions/13547639/return-window-handle-by-its-name-title
 *         - https://blog.naver.com/zlatmgpdjtiq/222016292758
 *         - https://stackoverflow.com/questions/5427020/prompt-dialog-in-windows-forms
 *         - https://stackoverflow.com/questions/31856473/how-to-send-an-enter-press-to-another-application-in-wpf
 *         - https://stackoverflow.com/questions/11365605/c-sharp-postmessage-syntax-trying-to-post-a-wm-char-to-another-applications-win
 *         - https://docs.microsoft.com/ko-kr/windows/win32/inputdev/virtual-key-codes?redirectedfrom=MSDN
 */

using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace WelsonJS
{
    [ComVisible(true)]
    public class Toolkit
    {
        private static string ApplicationName = "WelsonJS";

        [DllImport("user32.dll")]
        public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll")]
        public static extern IntPtr FindWindowEx(IntPtr hWnd1, IntPtr hWnd2, string lpsz1, string lpsz2);

        [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern bool PostMessage(IntPtr hWnd, uint msg, int wParam, IntPtr lParam);

        [DllImport("user32.dll")]
        public static extern int SendMessage(IntPtr hWnd, uint msg, int wParam, IntPtr lParam);

        public enum WMessages : int
        {
            WM_MOUSEMOVE = 0x200,
            WM_LBUTTONDOWN = 0x201, //Left mousebutton down
            WM_LBUTTONUP = 0x202,  //Left mousebutton up
            WM_LBUTTONDBLCLK = 0x203, //Left mousebutton doubleclick
            WM_RBUTTONDOWN = 0x204, //Right mousebutton down
            WM_RBUTTONUP = 0x205,   //Right mousebutton up
            WM_RBUTTONDBLCLK = 0x206, //Right mousebutton doubleclick
            WM_KEYDOWN = 0x100,  //Key down
            WM_KEYUP = 0x101,   //Key up
            WM_SYSKEYDOWN = 0x104,
            WM_SYSKEYUP = 0x105,
            WM_CHAR = 0x102,     //char
            WM_COMMAND = 0x111
        }

        public enum WVirtualKeys : int
        {
            VK_RETURN = 0x0D
        }

        public IntPtr QueryHandleWindow(string wName)
        {
            IntPtr hWnd = IntPtr.Zero;

            foreach (Process pList in Process.GetProcesses())
            {
                if (pList.MainWindowTitle.Contains(wName))
                {
                    hWnd = pList.MainWindowHandle;
                    break;
                }
            }

            return hWnd;
        }

        [ComVisible(true)]
        public bool SendClick(string wName, int X, int Y)
        {
            bool result = false;

            IntPtr hWnd = QueryHandleWindow(wName);
            if (hWnd != IntPtr.Zero) {
                PostMessage(hWnd, (int)WMessages.WM_LBUTTONDOWN, 1, new IntPtr(Y * 0x10000 + X));
                PostMessage(hWnd, (int)WMessages.WM_LBUTTONUP, 0, new IntPtr(Y * 0x10000 + X));
                result = true;
            }

            return result;
        }

        [ComVisible(true)]
        public bool SendKey(string wName, char key)
        {
            IntPtr hWnd = QueryHandleWindow(wName);
            return SendKey(hWnd, key);
        }

        public bool SendKey(IntPtr hWnd, char key)
        {
            return PostMessage(hWnd, (int)WMessages.WM_CHAR, key, IntPtr.Zero);
        }

        [ComVisible(true)]
        public bool SendKeys(string wName, string str)
        {
            bool result = false;

            IntPtr hWnd = QueryHandleWindow(wName);
            if (hWnd != IntPtr.Zero)
            {
                foreach (char i in str)
                {
                    SendKey(hWnd, i);
                }
                result = true;
            }

            return result;
        }

        [ComVisible(true)]
        public int Alert(string message)
        {
            MessageBox.Show(message, ApplicationName);
            return 0;
        }

        [ComVisible(true)]
        public bool Confirm(string message)
        {
            return (MessageBox.Show(message, ApplicationName, MessageBoxButtons.YesNo) == DialogResult.Yes);
        }

        [ComVisible(true)]
        public string Prompt(string message, string _default = "")
        {
            string result = WelsonJS.Prompt.ShowDialog(message, ApplicationName);
            return (result == "" ? _default : result);
        }

        [ComVisible(true)]
        public bool SendEnterKey(string wName)
        {
            IntPtr hWnd = QueryHandleWindow(wName);

            if (hWnd != IntPtr.Zero)
            {
                PostMessage(hWnd, (int)WMessages.WM_KEYDOWN, (char)WVirtualKeys.VK_RETURN, IntPtr.Zero);
                PostMessage(hWnd, (int)WMessages.WM_KEYUP, (char)WVirtualKeys.VK_RETURN, IntPtr.Zero);
                return true;
            }
            else
            {
                return false;
            }
        }
    }
}

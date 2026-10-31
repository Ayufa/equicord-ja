/*
 * Equicord JA Setup launcher (personal use)
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * 日本語化した Equicord ビルド (dist/desktop) と公式 CLI インストーラー
 * (EquilotlCli.exe) を内蔵し、起動するだけで Discord にインストールする。
 * 仕組みは本家の `pnpm inject` (scripts/runInstaller.mjs) と同じで、
 * 同じ環境変数を設定して EquilotlCli.exe --install を実行するだけ。
 */

using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Reflection;
using System.Text;

internal static class Program
{
    private static int Main(string[] args)
    {
        Console.OutputEncoding = Encoding.UTF8;
        var uninstall = args.Any(a =>
            a.Equals("uninstall", StringComparison.OrdinalIgnoreCase) ||
            a.Equals("--uninstall", StringComparison.OrdinalIgnoreCase));

        try
        {
            var installDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "equicord-ja");
            var desktopDir = Path.Combine(installDir, "dist", "desktop");
            var installerDir = Path.Combine(installDir, "installer");
            Directory.CreateDirectory(desktopDir);
            Directory.CreateDirectory(installerDir);

            Console.WriteLine("Equicord JA のファイルを展開しています...");
            ExtractZipResource("payload.zip", desktopDir);
            var cliPath = Path.Combine(installerDir, "EquilotlCli.exe");
            ExtractFileResource("EquilotlCli.exe", cliPath);

            if (!uninstall && IsDiscordRunning())
            {
                Console.Write("Discord が起動中です。終了してから続けますか？ [Y/n]: ");
                var answer = Console.ReadLine();
                if (answer != null && answer.Trim().Equals("n", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine("中止しました。Discord を終了してから、もう一度実行してください。");
                    WaitExit();
                    return 1;
                }
                KillDiscord();
            }

            var psi = new ProcessStartInfo
            {
                FileName = cliPath,
                Arguments = uninstall ? "--uninstall" : "--install",
                UseShellExecute = false
            };
            psi.Environment["EQUICORD_DIRECTORY"] = desktopDir;
            psi.Environment["EQUICORD_USER_DATA_DIR"] = installDir;
            psi.Environment["EQUICORD_DEV_INSTALL"] = "1";

            Console.WriteLine(uninstall ? "アンインストールを実行します..." : "インストールを実行します...");
            using var process = Process.Start(psi);
            if (process == null)
                throw new InvalidOperationException("インストーラーを起動できませんでした。");
            process.WaitForExit();

            Console.WriteLine(process.ExitCode == 0
                ? (uninstall
                    ? "アンインストールが完了しました。"
                    : "インストールが完了しました。Discord を起動してください。")
                : $"インストーラーがエラーで終了しました (コード {process.ExitCode})。上のログを確認してください。");
            WaitExit();
            return process.ExitCode;
        }
        catch (Exception ex)
        {
            Console.WriteLine("エラーが発生しました: " + ex.Message);
            WaitExit();
            return 1;
        }
    }

    private static Stream OpenResource(string name)
    {
        var asm = Assembly.GetExecutingAssembly();
        var fullName = asm.GetManifestResourceNames()
            .FirstOrDefault(n => n.EndsWith(name, StringComparison.OrdinalIgnoreCase));
        if (fullName == null)
            throw new InvalidOperationException("内蔵ファイルが見つかりません: " + name);
        var stream = asm.GetManifestResourceStream(fullName);
        if (stream == null)
            throw new InvalidOperationException("内蔵ファイルを開けません: " + name);
        return stream;
    }

    private static void ExtractFileResource(string name, string destPath)
    {
        using var src = OpenResource(name);
        using var dst = File.Create(destPath);
        src.CopyTo(dst);
    }

    private static void ExtractZipResource(string name, string destDir)
    {
        using var src = OpenResource(name);
        using var zip = new ZipArchive(src, ZipArchiveMode.Read);
        foreach (var entry in zip.Entries)
        {
            var destPath = Path.GetFullPath(Path.Combine(destDir, entry.FullName));
            if (!destPath.StartsWith(Path.GetFullPath(destDir), StringComparison.OrdinalIgnoreCase))
                continue; // zip slip guard
            if (entry.Name.Length == 0)
            {
                Directory.CreateDirectory(destPath);
                continue;
            }
            Directory.CreateDirectory(Path.GetDirectoryName(destPath));
            entry.ExtractToFile(destPath, overwrite: true);
        }
    }

    private static readonly string[] DiscordProcessNames = { "Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment" };

    private static bool IsDiscordRunning()
    {
        return DiscordProcessNames.Any(n => Process.GetProcessesByName(n).Length > 0);
    }

    private static void KillDiscord()
    {
        foreach (var name in DiscordProcessNames)
        {
            foreach (var p in Process.GetProcessesByName(name))
            {
                try
                {
                    p.Kill();
                    p.WaitForExit(5000);
                }
                catch
                {
                    // 既に終了している場合などは無視する
                }
                finally
                {
                    p.Dispose();
                }
            }
        }
    }

    private static void WaitExit()
    {
        Console.WriteLine();
        Console.Write("Enter キーを押すと閉じます。");
        Console.ReadLine();
    }
}

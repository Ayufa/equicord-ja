/*
 * Equicord JA Setup launcher (personal use)
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * 日本語化した Equicord ビルド (standalone の equicord.asar) と公式 CLI
 * インストーラー (EquilotlCli.exe) を内蔵した GUI インストーラー。
 * インストール処理そのものは本家の `pnpm inject` (scripts/runInstaller.mjs)
 * と同じで、同じ環境変数を設定して EquilotlCli.exe --install を
 * バックグラウンドで実行する（コンソール画面は出ない）。
 */

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.SetHighDpiMode(HighDpiMode.SystemAware);
        Application.Run(new MainForm());
    }
}

internal sealed class MainForm : Form
{
    private readonly Label statusLabel;
    private readonly TextBox logBox;
    private readonly ProgressBar progressBar;
    private readonly Button installButton;
    private readonly Button uninstallButton;
    private readonly Button closeButton;

    private readonly string installDir;
    private readonly string asarPath;
    private readonly string installerDir;
    private readonly string cliPath;

    public MainForm()
    {
        installDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "equicord-ja");
        asarPath = Path.Combine(installDir, "equicord.asar");
        installerDir = Path.Combine(installDir, "installer");
        cliPath = Path.Combine(installerDir, "EquilotlCli.exe");

        Text = "Equicord JA セットアップ";
        ClientSize = new Size(560, 404);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        Font = new Font("Yu Gothic UI", 9F);

        var titleLabel = new Label
        {
            Text = "Equicord JA（日本語化版）を Discord にインストールします。",
            Location = new Point(16, 14),
            Size = new Size(528, 22)
        };
        statusLabel = new Label
        {
            Text = "「インストール」ボタンを押してください。",
            Location = new Point(16, 42),
            Size = new Size(528, 22)
        };
        progressBar = new ProgressBar
        {
            Location = new Point(16, 70),
            Size = new Size(528, 14),
            Style = ProgressBarStyle.Continuous
        };
        logBox = new TextBox
        {
            Location = new Point(16, 92),
            Size = new Size(528, 252),
            Multiline = true,
            ReadOnly = true,
            ScrollBars = ScrollBars.Vertical,
            BackColor = Color.White
        };
        installButton = new Button
        {
            Text = "インストール",
            Location = new Point(16, 356),
            Size = new Size(140, 32)
        };
        uninstallButton = new Button
        {
            Text = "アンインストール",
            Location = new Point(164, 356),
            Size = new Size(150, 32)
        };
        closeButton = new Button
        {
            Text = "閉じる",
            Location = new Point(404, 356),
            Size = new Size(140, 32)
        };

        installButton.Click += async (s, e) => await RunInstallerAsync(false);
        uninstallButton.Click += async (s, e) => await RunInstallerAsync(true);
        closeButton.Click += (s, e) => Close();

        Controls.AddRange(new Control[]
        {
            titleLabel, statusLabel, progressBar, logBox,
            installButton, uninstallButton, closeButton
        });
    }

    private async Task RunInstallerAsync(bool uninstall)
    {
        SetBusy(true);
        try
        {
            Directory.CreateDirectory(installDir);
            Directory.CreateDirectory(installerDir);

            // 前回の実行でインストーラー本体 (EquilotlCli) が残っていると
            // ファイルがロックされて上書きできないため、先に終了させる
            KillStaleCli();

            if (!uninstall)
            {
                statusLabel.Text = "ファイルを配置しています...";
                ExtractFileResource("equicord.asar", asarPath);
                AppendLog("Equicord JA 本体を配置しました: " + asarPath);
            }

            ExtractCli();

            // 対象の Discord を決める。CLI の対話式の選択画面は GUI からは
            // 操作できないため、--location / --branch で非対話に指定する
            var installs = FindDiscordInstalls();
            string targetArgs;
            if (installs.Count == 1)
            {
                targetArgs = $" --location \"{installs[0].Path}\"";
                AppendLog($"対象の Discord: {installs[0].DisplayName} ({installs[0].Path})");
            }
            else if (installs.Count >= 2)
            {
                var chosen = ChooseDiscord(installs, uninstall);
                if (chosen == null)
                {
                    statusLabel.Text = "中止しました。";
                    AppendLog("ユーザーにより中止されました。");
                    return;
                }
                targetArgs = $" --location \"{chosen.Path}\"";
                AppendLog($"対象の Discord: {chosen.DisplayName} ({chosen.Path})");
            }
            else
            {
                targetArgs = " --branch auto";
                AppendLog("Discord の場所を自動検出します。");
            }

            if (IsDiscordRunning())
            {
                var answer = MessageBox.Show(
                    this,
                    "Discord が起動中です。終了してから続けますか？",
                    "確認",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question);
                if (answer != DialogResult.Yes)
                {
                    statusLabel.Text = "中止しました。Discord を終了してから、もう一度お試しください。";
                    AppendLog("ユーザーにより中止されました。");
                    return;
                }
                KillDiscord();
                AppendLog("Discord を終了しました。");
            }

            statusLabel.Text = uninstall ? "アンインストールしています..." : "インストールしています...";
            progressBar.Style = ProgressBarStyle.Marquee;
            AppendLog(uninstall ? "アンインストールを開始します。" : "インストールを開始します。");

            var exitCode = await RunCliAsync((uninstall ? "--uninstall" : "--install") + targetArgs);

            progressBar.Style = ProgressBarStyle.Continuous;
            if (exitCode == 0)
            {
                progressBar.Value = 100;
                statusLabel.Text = uninstall ? "アンインストールが完了しました。" : "インストールが完了しました。";
                AppendLog("完了しました。");
                MessageBox.Show(
                    this,
                    uninstall
                        ? "アンインストールが完了しました。"
                        : "インストールが完了しました。Discord を起動してください。",
                    "完了",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
            else if (exitCode == -2)
            {
                progressBar.Value = 0;
                statusLabel.Text = "インストーラーが応答しなかったため、強制終了しました。";
                MessageBox.Show(
                    this,
                    "インストーラーが2分間応答しなかったため、強制終了しました。\nもう一度お試しください。",
                    "エラー",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
            }
            else
            {
                progressBar.Value = 0;
                statusLabel.Text = $"インストーラーがエラーで終了しました (コード {exitCode})。";
                AppendLog($"エラーで終了しました (コード {exitCode})。上のログを確認してください。");
                MessageBox.Show(
                    this,
                    $"インストーラーがエラーで終了しました (コード {exitCode})。\nログの内容を確認してください。",
                    "エラー",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
            }
        }
        catch (Exception ex)
        {
            progressBar.Style = ProgressBarStyle.Continuous;
            progressBar.Value = 0;
            statusLabel.Text = "エラーが発生しました。";
            AppendLog("エラー: " + ex.Message);
            MessageBox.Show(this, "エラーが発生しました: " + ex.Message, "エラー",
                MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            SetBusy(false);
        }
    }

    private async Task<int> RunCliAsync(string arguments)
    {
        var psi = new ProcessStartInfo
        {
            FileName = cliPath,
            Arguments = arguments,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };
        psi.Environment["EQUICORD_DIRECTORY"] = asarPath;
        psi.Environment["EQUICORD_USER_DATA_DIR"] = installDir;
        psi.Environment["EQUICORD_DEV_INSTALL"] = "1";

        using var process = new Process { StartInfo = psi, EnableRaisingEvents = true };
        process.OutputDataReceived += (s, e) => { if (e.Data != null) AppendLog(e.Data); };
        process.ErrorDataReceived += (s, e) => { if (e.Data != null) AppendLog(e.Data); };

        if (!process.Start())
            throw new InvalidOperationException("インストーラーを起動できませんでした。");
        // 標準入力はすぐ閉じる。開いたままだと、CLI が入力待ちで止まり続けることがある
        process.StandardInput.Close();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        // 応答がなくなった場合に備えた見張り（2分で強制終了）
        var exitTask = process.WaitForExitAsync();
        var finished = await Task.WhenAny(exitTask, Task.Delay(TimeSpan.FromSeconds(120)));
        if (finished != exitTask)
        {
            AppendLog("インストーラーの応答がないため、強制終了しました。");
            try { process.Kill(entireProcessTree: true); } catch { /* 既に終了している場合など */ }
            await exitTask;
            return -2;
        }
        return process.ExitCode;
    }

    private void SetBusy(bool busy)
    {
        installButton.Enabled = !busy;
        uninstallButton.Enabled = !busy;
        closeButton.Enabled = !busy;
        UseWaitCursor = busy;
    }

    private void AppendLog(string line)
    {
        if (InvokeRequired)
        {
            BeginInvoke(new Action<string>(AppendLog), line);
            return;
        }
        logBox.AppendText(line + Environment.NewLine);
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

    // EquilotlCli.exe の展開。前回の残留プロセス等でロックされている場合は
    // 残留プロセスを終了させて再試行し、それでも無理なら既存ファイルを使う。
    private void ExtractCli()
    {
        try
        {
            ExtractFileResource("EquilotlCli.exe", cliPath);
            return;
        }
        catch (IOException)
        {
            KillStaleCli();
        }

        try
        {
            if (File.Exists(cliPath)) File.Delete(cliPath);
            ExtractFileResource("EquilotlCli.exe", cliPath);
        }
        catch (IOException)
        {
            if (!File.Exists(cliPath)) throw;
            AppendLog("既存のインストーラー本体をそのまま使います。");
        }
    }

    // このセットアップが配置した EquilotlCli.exe のプロセスだけを終了させる
    private void KillStaleCli()
    {
        foreach (var p in Process.GetProcessesByName("EquilotlCli"))
        {
            try
            {
                var path = p.MainModule?.FileName;
                if (path != null && string.Equals(path, cliPath, StringComparison.OrdinalIgnoreCase))
                {
                    p.Kill();
                    p.WaitForExit(3000);
                    AppendLog("前回のインストーラープロセスが残っていたため、終了させました。");
                }
            }
            catch
            {
                // 権限不足や既に終了している場合は無視する
            }
            finally
            {
                p.Dispose();
            }
        }
    }

    private sealed class DiscordCandidate
    {
        public string Branch = "";
        public string DisplayName = "";
        public string Path = "";
    }

    // 標準的な場所にある Discord を探す（app-* フォルダがあるものだけを対象にする）
    private static List<DiscordCandidate> FindDiscordInstalls()
    {
        var local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var defs = new[]
        {
            ("stable", "Stable", "Discord"),
            ("ptb", "PTB", "DiscordPTB"),
            ("canary", "Canary", "DiscordCanary")
        };
        var list = new List<DiscordCandidate>();
        foreach (var (branch, name, folder) in defs)
        {
            var path = Path.Combine(local, folder);
            if (Directory.Exists(path) && Directory.GetDirectories(path, "app-*").Length > 0)
                list.Add(new DiscordCandidate { Branch = branch, DisplayName = name, Path = path });
        }
        return list;
    }

    // 複数の Discord がある場合の選択ダイアログ
    private DiscordCandidate? ChooseDiscord(List<DiscordCandidate> installs, bool uninstall)
    {
        using var form = new Form
        {
            Text = uninstall ? "アンインストール対象の選択" : "インストール対象の選択",
            ClientSize = new Size(440, 130 + installs.Count * 30),
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false,
            MinimizeBox = false,
            StartPosition = FormStartPosition.CenterParent,
            Font = Font
        };
        var label = new Label
        {
            Text = "Discord が複数見つかりました。対象を選んでください。",
            Location = new Point(16, 14),
            Size = new Size(408, 22)
        };
        form.Controls.Add(label);

        var radios = new List<RadioButton>();
        for (var i = 0; i < installs.Count; i++)
        {
            var c = installs[i];
            var radio = new RadioButton
            {
                Text = $"{c.DisplayName} - {c.Path}",
                Location = new Point(20, 44 + i * 30),
                Size = new Size(404, 24),
                Checked = i == 0,
                Tag = c
            };
            radios.Add(radio);
            form.Controls.Add(radio);
        }

        DiscordCandidate? result = null;
        var okButton = new Button
        {
            Text = "決定",
            Size = new Size(110, 32),
            Location = new Point(314, 56 + installs.Count * 30)
        };
        okButton.Click += (s, e) =>
        {
            result = radios.First(r => r.Checked).Tag as DiscordCandidate;
            form.DialogResult = DialogResult.OK;
            form.Close();
        };
        form.Controls.Add(okButton);
        form.AcceptButton = okButton;

        return form.ShowDialog(this) == DialogResult.OK ? result : null;
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
}

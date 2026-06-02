import os from "os";
import { env } from "@repo/config";

// ─── ANSI color codes (no extra dependency needed) ───────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",

  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  gray: "\x1b[90m",

  bgGreen: "\x1b[42m",
} as const;

// Disable colors when output is piped (e.g. Docker log files)
const NO_COLOR = !process.stdout.isTTY;
const paint = (color: string, text: string) =>
  NO_COLOR ? text : `${color}${text}${c.reset}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** All non-internal IPv4 addresses on this machine */
const getNetworkIPs = (): string[] => {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const iface of Object.values(interfaces)) {
    for (const alias of iface ?? []) {
      if (alias.family === "IPv4" && !alias.internal) {
        ips.push(alias.address);
      }
    }
  }

  return ips;
};

const formatBytes = (bytes: number): string => {
  const gb = bytes / 1024 ** 3;
  return gb >= 1
    ? `${gb.toFixed(1)} GB`
    : `${(bytes / 1024 ** 2).toFixed(0)} MB`;
};

const formatUptime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(" ");
};

const getPackageVersion = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require("../../package.json") as {
      version?: string;
      name?: string;
    };
    return pkg.version ?? "—";
  } catch {
    return "—";
  }
};

const getPackageName = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require("../../package.json") as { name?: string };
    return pkg.name ?? "app";
  } catch {
    return "app";
  }
};

// ─── Box drawing ─────────────────────────────────────────────────────────────

const BOX_WIDTH = 62; // inner width (between the borders)

const border = {
  top: "╔" + "═".repeat(BOX_WIDTH) + "╗",
  mid: "╠" + "═".repeat(BOX_WIDTH) + "╣",
  bottom: "╚" + "═".repeat(BOX_WIDTH) + "╝",
  empty: "║" + " ".repeat(BOX_WIDTH) + "║",
};

const row = (label: string, value: string, labelColor = c.gray): string => {
  const labelPart = paint(labelColor, label.padEnd(14));
  const valuePart = paint(c.white, value);
  const content = `  ${labelPart}  ${valuePart}`;

  // Strip ANSI for length calculation
  const visibleLen = content.replace(/\x1b\[[0-9;]*m/g, "").length;
  const padding = Math.max(0, BOX_WIDTH - visibleLen - 1);

  return `║${content}${" ".repeat(padding)}║`;
};

const centeredRow = (text: string): string => {
  const visibleLen = text.replace(/\x1b\[[0-9;]*m/g, "").length;
  const totalPad = BOX_WIDTH - visibleLen;
  const left = Math.floor(totalPad / 2);
  const right = totalPad - left;
  return `║${" ".repeat(left)}${text}${" ".repeat(right)}║`;
};

// ─── Main export ─────────────────────────────────────────────────────────────

export const printStartupLog = (): void => {
  const networkIPs = getNetworkIPs();
  const primaryIP = networkIPs[0] ?? "unavailable";
  const extraIPs = networkIPs.slice(1);

  const cpuModel =
    os.cpus()[0]?.model.replace(/\s+/g, " ").trim() ?? "Unknown CPU";
  const cpuCores = os.cpus().length;
  const totalMem = formatBytes(os.totalmem());
  const freeMem = formatBytes(os.freemem());
  const appName = getPackageName();
  const appVer = getPackageVersion();
  const startedAt = new Date().toLocaleString("en-GB", { hour12: false });

  // ── Environment badge color ──
  const envColors: Record<string, string> = {
    production: c.green,
    staging: c.yellow,
    development: c.cyan,
    test: c.magenta,
  };
  const envColor = envColors[env.NODE_ENV] ?? c.white;
  const envBadge = paint(c.bold + envColor, env.NODE_ENV.toUpperCase());

  const lines: string[] = [
    paint(c.cyan, border.top),

    // Title
    paint(c.cyan, border.empty),
    paint(
      c.cyan,
      centeredRow(paint(c.bold + c.green, "✦  SERVER STARTED SUCCESSFULLY  ✦")),
    ),
    paint(c.cyan, border.empty),

    paint(c.cyan, border.mid),

    // App section
    row("App", `${appName}  ${paint(c.dim, "v" + appVer)}`),
    row("Environment", envBadge),
    row("Port", paint(c.bold + c.cyan, String(env.PORT))),
    row("PID", paint(c.dim, String(process.pid))),
    row("Node.js", paint(c.dim, process.version)),

    paint(c.cyan, border.mid),

    // Machine section
    row("Hostname", paint(c.yellow, os.hostname())),
    row("Platform", `${os.type()} ${os.release()}  (${os.arch()})`),
    row("CPU", `${cpuModel.slice(0, 36)}  ${paint(c.dim, `× ${cpuCores}`)}`),
    row("Memory", `${totalMem} total  ${paint(c.dim, freeMem + " free")}`),
    row("OS Uptime", formatUptime(os.uptime())),

    paint(c.cyan, border.mid),

    // Network section
    row("Local", paint(c.bold + c.cyan, `http://localhost:${env.PORT}`)),
    row("Network", paint(c.bold + c.green, `http://${primaryIP}:${env.PORT}`)),
    // Extra IPs (multi-NIC servers)
    ...extraIPs.map((ip) =>
      row("", paint(c.green, `http://${ip}:${env.PORT}`)),
    ),

    paint(c.cyan, border.mid),

    // Timestamp
    row("Started at", paint(c.dim, startedAt)),

    paint(c.cyan, border.empty),
    paint(c.cyan, border.bottom),
  ];

  console.log("\n" + lines.join("\n") + "\n");
};

# LinguaVerse · Cloudflare Pages 一键部署脚本
# 用法：
#   powershell -ExecutionPolicy Bypass -File deploy.ps1              # 部署/更新
#   powershell -ExecutionPolicy Bypass -File deploy.ps1 -Login       # 浏览器 OAuth 登录 Cloudflare（首次用这个）
#   powershell -ExecutionPolicy Bypass -File deploy.ps1 -ProjectName myname
param(
    [switch]$Login,
    [string]$ProjectName = "linguaverse-web"
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 本机 PATHEXT 被污染时 PowerShell 会拒绝执行 .exe/.cmd，先兜底恢复
if ($env:PATHEXT -notmatch '\.EXE') {
    $env:PATHEXT = '.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC;.CPL'
}

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

# ---- 找 node / npx ----
$NodeCandidates = @(
    'C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node.exe',
    (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
    'D:\tools\node\node.exe'
)
$Node = $NodeCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $Node) { Write-Host "[ERR] 没找到 node.exe，请先安装 Node.js 18+" -ForegroundColor Red; exit 1 }
$NpxCli = Join-Path (Split-Path -Parent $Node) 'node_modules\npm\bin\npx-cli.js'
Write-Host "Node: $Node"

function Invoke-Wrangler([string[]]$WArgs) {
    if (Test-Path $NpxCli) {
        & $Node $NpxCli --yes wrangler@latest @WArgs 2>&1 | ForEach-Object { Write-Host $_ }
    } else {
        & npx.cmd --yes wrangler@latest @WArgs 2>&1 | ForEach-Object { Write-Host $_ }
    }
    return $LASTEXITCODE
}

# ---- 登录模式：浏览器 OAuth（一次性） ----
if ($Login) {
    Write-Host "即将打开浏览器进行 Cloudflare OAuth 登录（只需一次）..." -ForegroundColor Cyan
    [void](Invoke-Wrangler @('login'))
    exit $LASTEXITCODE
}

# ---- 登录态检查 ----
Write-Host "检查 Cloudflare 登录态..." -ForegroundColor Cyan
$whoOut = & $Node $NpxCli --yes wrangler@latest whoami 2>&1 | Out-String
Write-Host $whoOut
if ($whoOut -notmatch '@' -and $whoOut -notmatch 'logged in' -and $whoOut -notmatch 'You are logged in') {
    Write-Host ""
    Write-Host "[!] 还没有登录 Cloudflare。二选一：" -ForegroundColor Yellow
    Write-Host "    ① powershell -ExecutionPolicy Bypass -File deploy.ps1 -Login   （浏览器授权，推荐）"
    Write-Host "    ② \$env:CLOUDFLARE_API_TOKEN = '真实令牌' 后重试"
    Write-Host "       令牌在 dash.cloudflare.com → My Profile → API Tokens 创建，"
    Write-Host "       使用『Cloudflare Pages (Edit)』权限模板。"
    exit 1
}

# ---- 准备 D1 数据库（P1 云端账号与同步） ----
Write-Host "准备 D1 数据库：linguaverse" -ForegroundColor Cyan
[void](Invoke-Wrangler @('d1', 'create', 'linguaverse'))
[void](Invoke-Wrangler @('d1', 'execute', 'linguaverse', '--file=./schema.sql'))
$infoJson = & $Node $NpxCli --yes wrangler@latest d1 info linguaverse --json 2>&1 | Out-String
$idMatch = [regex]::Match($infoJson, '"uuid"\s*:\s*"([0-9a-fA-F-]+)"')
if ($idMatch.Success -and (Test-Path wrangler.toml)) {
    $toml = Get-Content wrangler.toml -Raw
    if ($toml -match 'REPLACE_WITH_D1_ID') {
        $toml = $toml -replace 'REPLACE_WITH_D1_ID', $idMatch.Groups[1].Value
        Set-Content wrangler.toml -Value $toml -NoNewline
        Write-Host "已把 D1 id 写入 wrangler.toml" -ForegroundColor Green
    }
}

# ---- 创建项目（已存在则忽略报错） ----
Write-Host "确保 Pages 项目存在：$ProjectName" -ForegroundColor Cyan
[void](Invoke-Wrangler @('pages', 'project', 'create', $ProjectName, '--production-branch=master'))

# ---- 部署静态站点（整个目录，入口 index.html） ----
Write-Host "部署中..." -ForegroundColor Cyan
# 部署由领主手动执行（--branch=master）
$code = Invoke-Wrangler @('pages', 'deploy', '.', '--project-name=' + $ProjectName, '--branch=master', '--commit-dirty=true')
if ($code -eq 0) {
    Write-Host ""
    Write-Host "✅ 部署成功！访问地址：" -ForegroundColor Green
    Write-Host "   https://$ProjectName.pages.dev"
} else {
    Write-Host "[ERR] 部署失败，请检查上方日志" -ForegroundColor Red
}
exit $code

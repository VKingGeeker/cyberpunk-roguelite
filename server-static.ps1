$port = 8888
$distPath = "$PSScriptRoot\dist"

$http = [System.Net.HttpListener]::new()
$http.Prefixes.Add("http://127.0.0.1:$port/")
$http.Start()

Write-Host "Server running at http://127.0.0.1:$port/"
Write-Host "Press Ctrl+C to stop"

$contentTypes = @{
    '.html' = 'text/html'
    '.js' = 'application/javascript'
    '.css' = 'text/css'
    '.json' = 'application/json'
    '.png' = 'image/png'
    '.jpg' = 'image/jpeg'
    '.gif' = 'image/gif'
    '.svg' = 'image/svg+xml'
    '.ico' = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2' = 'font/woff2'
    '.ttf' = 'font/ttf'
}

try {
    while ($http.IsListening) {
        $context = $http.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq '/') { $urlPath = '/index.html' }
        
        $filePath = Join-Path $distPath $urlPath.TrimStart('/')
        
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = if ($contentTypes.ContainsKey($ext)) { $contentTypes[$ext] } else { 'application/octet-stream' }
            
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $content.Length
            $response.ContentType = $contentType
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $indexPath = Join-Path $distPath 'index.html'
            if (Test-Path $indexPath) {
                $content = [System.IO.File]::ReadAllBytes($indexPath)
                $response.ContentLength64 = $content.Length
                $response.ContentType = 'text/html'
                $response.OutputStream.Write($content, 0, $content.Length)
            } else {
                $response.StatusCode = 404
            }
        }
        
        $response.OutputStream.Close()
    }
} finally {
    $http.Stop()
}

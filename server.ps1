$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Server started at http://localhost:8080/"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $filePath = Join-Path $pwd $request.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($request.Url.LocalPath) -or $request.Url.LocalPath -eq "/") {
        $filePath = Join-Path $pwd "index.html"
    }

    if (Test-Path $filePath -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $extension = [System.IO.Path]::GetExtension($filePath)
        
        switch ($extension) {
            ".html" { $response.ContentType = "text/html" }
            ".css"  { $response.ContentType = "text/css" }
            ".js"   { $response.ContentType = "application/javascript" }
            ".json" { $response.ContentType = "application/json" }
            default { $response.ContentType = "application/octet-stream" }
        }
        
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
    }
    $response.Close()
}

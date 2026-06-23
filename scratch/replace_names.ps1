$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx
foreach ($file in $files) {
    if ($file.Name -match "auth.ts" -or $file.Name -match "route.ts" -and $file.FullName -match "profile") { continue }
    
    $content = Get-Content -Path $file.FullName -Raw
    $newContent = $content -replace "session\.user\.name", "(session.user.icName || session.user.name)"
    $newContent = $newContent -replace "user\?\.name", "(user?.icName || user?.name)"
    
    # Fix double replacements just in case
    $newContent = $newContent -replace "\(\(session\.user\.icName \|\| session\.user\.name\)\)", "(session.user.icName || session.user.name)"
    $newContent = $newContent -replace "\(\(user\?\.\icName \|\| user\?\.name\)\)", "(user?.icName || user?.name)"

    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Updated $($file.FullName)"
    }
}

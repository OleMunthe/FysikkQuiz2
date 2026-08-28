Get-ChildItem -Filter "*.html" -Recurse | ForEach-Object {
    $fil = $_.FullName
    $innhold = Get-Content $fil -Raw
    
    $nyttInnhold = $innhold.Replace(
        "<title>Flervalgsoppgaver Fysikk 1</title>",
        "<title>Flervalgsoppgaver Fysikk 2</title>"
    )
    
    if ($innhold -ne $nyttInnhold) {
        Set-Content -Path $fil -Value $nyttInnhold -Encoding UTF8
        Write-Host "Endret: $($_.Name)"
    }
}

Write-Host ""
Write-Host "Ferdig!"
Read-Host "Trykk Enter for å lukke"
# Persönliche Webseite

Statische Seite ohne Framework: `index.html`, `assets/style.css`, `assets/app.js`.
**Alle Inhalte stehen in `inhalt.json`** (Deutsch und Englisch nebeneinander), Code muss man zum Ändern nicht anfassen.

## Lokal ansehen
```
python -m http.server 8765 --bind 127.0.0.1
```
Dann http://127.0.0.1:8765 öffnen. Herkunft testen: `?von=linkedin` (öffnet Skills), `?von=github` (öffnet Projekte).

## Wie die Seite den Einstieg wählt
1. `#skills`, `#projekte`, `#ziele` in der Adresse gewinnen immer.
2. Sonst `?von=linkedin` / `?von=github` – **diese Links auf LinkedIn bzw. GitHub eintragen**, das ist zuverlässig.
3. Sonst die Herkunftsangabe des Browsers (linkedin.com, lnkd.in, github.com) – nur Notlösung.
4. Sonst die Startseite. Besucher können oben im Skill-/Projekt-Bereich ihr Interesse wählen; die Seite merkt es sich im Browser.

Es werden keine Besucher erkannt und keine Daten gesammelt.

## Skills pflegen
Jeder Skill in `skillGroups` hat:
- `pct` = Summe der `points` seiner Belege (wird so angezeigt, also bitte konsistent halten),
- `stage` passend zum Bereich (`grundlagen` 0–39, `angewendet` 40–64, `im_einsatz` 65–84, `sicher` 85–100),
- `evidence`: Belege mit `type` (`projekt`, `betrieb`, `studium`, `zertifikat`, `beruf`), `points`, Text, optional `link`,
- `full`: was 100 % bedeuten würde.
`"placeholder": true` zeigt „?“ und einen Hinweis statt Prozent.

## Vor dem Veröffentlichen offen
- [x] E-Mail-Adresse eingetragen.
- [ ] **Lebenslauf** als `assets/lebenslauf.pdf` ablegen und `person.cv.available` auf `true` setzen.
- [ ] **SAP & Zertifikate** (Platzhalter in `skillGroups` → `sap`) und **aktuelle Position** aus LinkedIn ergänzen.
- [ ] Prozentwerte und Studienangaben gegenlesen (Selbsteinschätzung!).
- [x] Schriften lokal eingebunden (assets/fonts, OFL).
- [ ] Impressum/Datenschutz prüfen, falls die Seite als geschäftsmäßig gilt; Link in `person.links.imprint`.
- [x] Veröffentlicht als Repo `shum-panda.github.io` → https://shum-panda.github.io/
